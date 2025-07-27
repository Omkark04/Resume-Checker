from io import BytesIO
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT, WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_ALIGN_VERTICAL
from fpdf import FPDF
from PIL import Image, ImageDraw
import os
import tempfile
from django.conf import settings
import base64
import subprocess
from pdf2image import convert_from_bytes
import warnings

warnings.filterwarnings("ignore", category=UserWarning, module="docx.styles.styles")

class ResumeGenerator:
    def __init__(self, resume_data):
        self.resume_data = resume_data
        self.font_name = "Times"  # Using built-in Times font
        self.heading_size = 14
        self.subheading_size = 12
        self.normal_size = 11
        self.profile_pic = resume_data.get('profile_pic')

    def _convert_to_pdf(self, docx_buffer, template_name):
        """Convert DOCX to PDF using LibreOffice or fallback to FPDF"""
        # Create temp files
        with tempfile.NamedTemporaryFile(suffix='.docx', delete=False) as temp_docx:
            temp_docx.write(docx_buffer.getvalue())
            temp_docx_path = temp_docx.name
        
        temp_pdf_path = temp_docx_path.replace('.docx', '.pdf')
        
        # Try LibreOffice conversion first
        try:
            result = subprocess.run([
                r'C:\Program Files\LibreOffice\program\soffice.exe', '--headless', '--convert-to', 'pdf', 
                temp_docx_path, '--outdir', os.path.dirname(temp_docx_path)
            ], capture_output=True, timeout=30)
            
            if result.returncode == 0 and os.path.exists(temp_pdf_path):
                with open(temp_pdf_path, 'rb') as f:
                    pdf_buffer = BytesIO(f.read())
            else:
                raise Exception("LibreOffice conversion failed")
                
        except Exception as e:
            print(f"LibreOffice conversion failed: {e}. Using FPDF fallback.")
            # Fallback to FPDF
            pdf_buffer = self._create_fallback_pdf(template_name)
        
        # Cleanup temp files
        try:
            os.unlink(temp_docx_path)
            if os.path.exists(temp_pdf_path):
                os.unlink(temp_pdf_path)
        except:
            pass
        
        return pdf_buffer

    def _create_fallback_pdf(self, template_name):
        """Create a simple PDF using FPDF as fallback"""
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font('Arial', 'B', 16)
        
        # Add basic content
        pdf.cell(0, 10, txt=self.resume_data.get('full_name', 'Resume'), ln=True, align='C')
        pdf.ln(5)
        
        pdf.set_font('Arial', size=12)
        pdf.cell(0, 8, txt=f"Template: {template_name.title()}", ln=True)
        pdf.cell(0, 8, txt=f"Email: {self.resume_data.get('email', '')}", ln=True)
        pdf.cell(0, 8, txt=f"Phone: {self.resume_data.get('phone', '')}", ln=True)
        pdf.ln(5)
        
        # Add summary
        if self.resume_data.get('summary'):
            pdf.set_font('Arial', 'B', 12)
            pdf.cell(0, 8, txt="Summary:", ln=True)
            pdf.set_font('Arial', size=10)
            
            # Handle long text
            summary = self.resume_data['summary']
            words = summary.split(' ')
            line = ""
            for word in words:
                test_line = line + word + " "
                if pdf.get_string_width(test_line) < 180:
                    line = test_line
                else:
                    if line:
                        pdf.cell(0, 6, txt=line.strip(), ln=True)
                    line = word + " "
            if line:
                pdf.cell(0, 6, txt=line.strip(), ln=True)
        
        buffer = BytesIO()
        pdf.output(buffer)
        buffer.seek(0)
        return buffer

    def _generate_thumbnail(self, pdf_buffer):
        """Generate thumbnail from PDF first page"""
        try:
            # Set poppler path explicitly for Windows
            poppler_path = r'C:\poppler\poppler-24.08.0\Library\bin'
            
            # Convert first page of PDF to image
            pdf_buffer.seek(0)
            pages = convert_from_bytes(
                pdf_buffer.read(), 
                first_page=1, 
                last_page=1, 
                dpi=150,
                poppler_path=poppler_path  # Add this parameter
            )
            
            if pages:
                # Resize to thumbnail size
                img = pages[0]
                img.thumbnail((300, 400), Image.Resampling.LANCZOS)
                
                # Convert to bytes
                thumbnail_buffer = BytesIO()
                img.save(thumbnail_buffer, format='PNG', optimize=True, quality=85)
                thumbnail_buffer.seek(0)
                return thumbnail_buffer
            
        except Exception as e:
            print(f"PDF thumbnail generation failed: {e}. Creating placeholder.")
        
        # Fallback: create a simple placeholder thumbnail
        return self._create_placeholder_thumbnail()

    def _create_placeholder_thumbnail(self):
        """Create a placeholder thumbnail"""
        img = Image.new('RGB', (300, 400), color=(245, 245, 245))
        draw = ImageDraw.Draw(img)
        
        # Draw border
        draw.rectangle([(10, 10), (290, 390)], outline=(200, 200, 200), width=2)
        
        # Add text
        try:
            from PIL import ImageFont
            font = ImageFont.load_default()
        except:
            font = None
        
        text = "Resume\nPreview"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        x = (300 - text_width) // 2
        y = (400 - text_height) // 2
        draw.text((x, y), text, fill=(100, 100, 100), font=font)
        
        thumbnail_buffer = BytesIO()
        img.save(thumbnail_buffer, format='PNG')
        thumbnail_buffer.seek(0)
        return thumbnail_buffer

    def generate_all_templates(self):
        """Generate all three templates and return data for database storage"""
        templates = []
        
        # Generate each template
        template_methods = [
            ('modern', self.generate_template1),
            ('classic', self.generate_template2),
            ('minimalist', self.generate_template3)
        ]
        
        for template_name, method in template_methods:
            try:
                print(f"Generating {template_name} template...")
                
                # Generate template
                template_data = method()
                pdf_buffer = template_data['pdf']
                
                # Generate thumbnail
                thumbnail_buffer = self._generate_thumbnail(pdf_buffer)
                
                # Prepare data for database storage
                pdf_buffer.seek(0)
                thumbnail_buffer.seek(0)
                
                template_info = {
                    'template_name': template_name,
                    'pdf_data': pdf_buffer.read(),
                    'pdf_filename': f"{template_name}_resume.pdf",
                    'thumbnail_data': thumbnail_buffer.read(),
                    'thumbnail_filename': f"{template_name}_thumbnail.png",
                }
                
                templates.append(template_info)
                print(f"✓ {template_name} template generated successfully")
                
            except Exception as e:
                print(f"✗ Error generating {template_name} template: {e}")
                # Continue with other templates even if one fails
                continue
        
        return templates

    def generate_template1(self):
        """Modern template with circular profile picture on left sidebar"""
        doc = Document()
        self._add_template1_header(doc)
        self._add_template1_content(doc)
        return self._save_docx(doc, "modern")

    def generate_template2(self):
        """Classic template with circular profile picture at top"""
        doc = Document()
        self._add_template2_header(doc)
        self._add_template2_content(doc)
        return self._save_docx(doc, "classic")

    def generate_template3(self):
        """Minimalist template without profile picture"""
        doc = Document()
        self._add_template3_header(doc)
        self._add_template3_content(doc)
        return self._save_docx(doc, "minimalist")

    def _save_docx(self, doc, template_name):
        """Save the document to a BytesIO object and convert to PDF"""
        buffer = BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        pdf_buffer = self._convert_to_pdf(buffer, template_name)
        return {
            'docx': buffer,
            'pdf': pdf_buffer,
            'template_name': template_name
        }

    def _add_circular_image(self, doc, image_data, size=1.5):
        """Add circular profile picture placeholder"""
        if not image_data:
            # Create a placeholder circle if no image provided
            paragraph = doc.add_paragraph()
            run = paragraph.add_run()
            run.add_picture(self._create_circle_placeholder(), width=Inches(size))
            return paragraph
        
        try:
            # Decode base64 image
            if ',' in image_data:
                image_bytes = base64.b64decode(image_data.split(',')[1])
            else:
                image_bytes = base64.b64decode(image_data)
                
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_img:
                temp_img.write(image_bytes)
                temp_img_path = temp_img.name
            
            # Add to document
            paragraph = doc.add_paragraph()
            run = paragraph.add_run()
            run.add_picture(temp_img_path, width=Inches(size))
            
            # Cleanup
            os.unlink(temp_img_path)
            return paragraph
        except Exception as e:
            print(f"Error processing profile image: {e}")
            # Fallback to placeholder
            return self._add_circular_image(doc, None, size)

    def _create_circle_placeholder(self):
        """Generate a simple circle placeholder image"""
        img = Image.new('RGB', (200, 200), color=(220, 220, 220))
        draw = ImageDraw.Draw(img)
        draw.ellipse((10, 10, 190, 190), fill=(200, 200, 200), outline=(150, 150, 150))
        img_io = BytesIO()
        img.save(img_io, format='PNG')
        img_io.seek(0)
        return img_io

    # Include all the original template methods unchanged...
    def _add_template1_header(self, doc):
        """Modern template header with sidebar"""
        # Create a table for layout (2 columns)
        table = doc.add_table(rows=1, cols=2)
        table.autofit = False
        table.columns[0].width = Inches(1.8)
        table.columns[1].width = Inches(4.2)
        
        # Left cell for profile picture and contact info
        left_cell = table.cell(0, 0)
        left_cell.vertical_alignment = WD_ALIGN_VERTICAL.TOP
        
        # Add circular profile picture
        pic_para = left_cell.add_paragraph()
        pic_para.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
        self._add_circular_image(doc, self.profile_pic, size=1.5)
        
        # Add contact info
        self._add_contact_info(left_cell, align='center')

    def _add_template1_content(self, doc):
        """Modern template content"""
        table = doc.tables[0]  # Get the header table
        right_cell = table.cell(0, 1)
        
        # Name and Title
        name_para = right_cell.add_paragraph()
        name_run = name_para.add_run(self.resume_data.get('full_name', ''))
        name_run.bold = True
        name_run.font.size = Pt(20)
        name_run.font.name = self.font_name
        
        title_para = right_cell.add_paragraph()
        title_run = title_para.add_run(self.resume_data.get('job_title', ''))
        title_run.font.size = Pt(14)
        title_run.font.color.rgb = RGBColor(100, 100, 100)
        
        # Summary
        self._add_section_header(right_cell, "PROFILE")
        right_cell.add_paragraph(self.resume_data.get('summary', ''))
        
        # Experience
        self._add_section_header(right_cell, "EXPERIENCE")
        for exp in self.resume_data.get('experiences', []):
            self._add_experience_item(right_cell, exp)
        
        # Education
        self._add_section_header(right_cell, "EDUCATION")
        for edu in self.resume_data.get('educations', []):
            self._add_education_item(right_cell, edu)
        
        # Skills
        self._add_section_header(right_cell, "SKILLS")
        skills_para = right_cell.add_paragraph()
        for skill in self.resume_data.get('skills', []):
            skills_para.add_run(f"• {skill.get('name', '')}\n")

    def _add_template2_header(self, doc):
        """Classic template header with profile picture at top"""
        # Name and Title
        name_para = doc.add_paragraph()
        name_para.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
        name_run = name_para.add_run(self.resume_data.get('full_name', ''))
        name_run.bold = True
        name_run.font.size = Pt(18)
        
        title_para = doc.add_paragraph()
        title_para.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
        title_run = title_para.add_run(self.resume_data.get('job_title', ''))
        title_run.font.size = Pt(14)
        title_run.font.color.rgb = RGBColor(100, 100, 100)
        
        # Add circular profile picture
        pic_para = doc.add_paragraph()
        pic_para.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
        self._add_circular_image(doc, self.profile_pic, size=1.2)
        
        # Add contact info
        contact_table = doc.add_table(rows=1, cols=3)
        contact_table.autofit = False
        contact_table.columns[0].width = Inches(2)
        contact_table.columns[1].width = Inches(2)
        contact_table.columns[2].width = Inches(2)
        
        contact_cell = contact_table.cell(0, 0)
        contact_cell.text = self.resume_data.get('phone', '')
        contact_cell.paragraphs[0].alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
        
        contact_cell = contact_table.cell(0, 1)
        contact_cell.text = self.resume_data.get('email', '')
        contact_cell.paragraphs[0].alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
        
        contact_cell = contact_table.cell(0, 2)
        contact_cell.text = self.resume_data.get('location', '')
        contact_cell.paragraphs[0].alignment = WD_PARAGRAPH_ALIGNMENT.CENTER

    def _add_template2_content(self, doc):
        """Classic template content"""
        # Left and right columns
        table = doc.add_table(rows=1, cols=2)
        table.autofit = False
        table.columns[0].width = Inches(3)
        table.columns[1].width = Inches(3)
        
        left_cell = table.cell(0, 0)
        right_cell = table.cell(0, 1)
        
        # Left column content
        self._add_section_header(left_cell, "ABOUT ME")
        left_cell.add_paragraph(self.resume_data.get('summary', ''))
        
        self._add_section_header(left_cell, "SKILLS")
        for skill in self.resume_data.get('skills', []):
            left_cell.add_paragraph(f"• {skill.get('name', '')}", style='ListBullet')
        
        self._add_section_header(left_cell, "CONTACT")
        if self.resume_data.get('linkedin_url'):
            self._add_hyperlink(left_cell.add_paragraph(), "LinkedIn", self.resume_data['linkedin_url'])
        if self.resume_data.get('github_url'):
            self._add_hyperlink(left_cell.add_paragraph(), "GitHub", self.resume_data['github_url'])
        
        # Right column content
        self._add_section_header(right_cell, "EXPERIENCE")
        for exp in self.resume_data.get('experiences', []):
            self._add_experience_item(right_cell, exp)
        
        self._add_section_header(right_cell, "EDUCATION")
        for edu in self.resume_data.get('educations', []):
            self._add_education_item(right_cell, edu)

    def _add_template3_header(self, doc):
        """Minimalist template header"""
        # Name and Title
        name_para = doc.add_paragraph()
        name_run = name_para.add_run(self.resume_data.get('full_name', ''))
        name_run.bold = True
        name_run.font.size = Pt(16)
        
        title_para = doc.add_paragraph()
        title_run = title_para.add_run(self.resume_data.get('job_title', ''))
        title_run.font.size = Pt(12)
        
        # Horizontal line
        doc.add_paragraph().add_run().add_break()
        line_para = doc.add_paragraph()
        line_run = line_para.add_run("_________________________________________________")
        line_run.font.size = Pt(8)
        
        # Contact info in single line
        contact_para = doc.add_paragraph()
        contact_run = contact_para.add_run(
            f"{self.resume_data.get('phone', '')} | "
            f"{self.resume_data.get('email', '')} | "
            f"{self.resume_data.get('location', '')}"
        )
        contact_run.font.size = Pt(10)

    def _add_template3_content(self, doc):
        """Minimalist template content"""
        self._add_section_header(doc, "SUMMARY")
        doc.add_paragraph(self.resume_data.get('summary', ''))
        
        self._add_section_header(doc, "EXPERIENCE")
        for exp in self.resume_data.get('experiences', []):
            self._add_experience_item(doc, exp)
        
        self._add_section_header(doc, "EDUCATION")
        for edu in self.resume_data.get('educations', []):
            self._add_education_item(doc, edu)
        
        self._add_section_header(doc, "SKILLS")
        skills_table = doc.add_table(rows=1, cols=3)
        skills_table.autofit = True
        
        # Split skills into 3 columns
        skills = self.resume_data.get('skills', [])
        chunk_size = (len(skills) // 3 + 1) if skills else 1
        skill_chunks = [skills[i:i + chunk_size] for i in range(0, len(skills), chunk_size)]
        
        for i, chunk in enumerate(skill_chunks[:3]):  # Limit to 3 columns
            if i < len(skills_table.columns):
                cell = skills_table.cell(0, i)
                for skill in chunk:
                    cell.add_paragraph(f"• {skill.get('name', '')}", style='ListBullet')

    def _add_contact_info(self, cell, align='left'):
        """Add contact information to a cell"""
        if align == 'center':
            alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
        else:
            alignment = WD_PARAGRAPH_ALIGNMENT.LEFT
            
        if self.resume_data.get('phone'):
            para = cell.add_paragraph(self.resume_data['phone'])
            para.alignment = alignment
        
        if self.resume_data.get('email'):
            para = cell.add_paragraph(self.resume_data['email'])
            para.alignment = alignment
        
        if self.resume_data.get('location'):
            para = cell.add_paragraph(self.resume_data['location'])
            para.alignment = alignment
        
        if self.resume_data.get('linkedin_url'):
            para = cell.add_paragraph()
            para.alignment = alignment
            self._add_hyperlink(para, "LinkedIn", self.resume_data['linkedin_url'])
        
        if self.resume_data.get('github_url'):
            para = cell.add_paragraph()
            para.alignment = alignment
            self._add_hyperlink(para, "GitHub", self.resume_data['github_url'])

    def _add_section_header(self, parent, title):
        """Add a section header"""
        if hasattr(parent, 'add_paragraph'):  # Check if it's a Document or Table cell
            para = parent.add_paragraph()
        else:
            raise ValueError("Parent must be a Document or Table cell")
        
        para.paragraph_format.space_before = Pt(12)
        run = para.add_run(title.upper())
        run.bold = True
        run.font.size = Pt(self.heading_size)
        run.font.name = self.font_name
        run.font.color.rgb = RGBColor(59, 89, 152)

    def _add_experience_item(self, parent, exp):
        """Add an experience item"""
        # Job title and company
        title_para = parent.add_paragraph()
        title_para.add_run(f"{exp.get('job_title', '')}").bold = True
        title_para.add_run(f" at {exp.get('company', '')}")
        
        # Duration and location
        details = []
        if exp.get('duration'):
            details.append(exp['duration'])
        if exp.get('location'):
            details.append(exp['location'])
        
        if details:
            details_para = parent.add_paragraph(", ".join(details))
            details_para.italic = True
            details_para.paragraph_format.space_after = Pt(6)
        
        # Responsibilities
        for resp in exp.get('responsibilities', []):
            if isinstance(resp, dict):
                desc = resp.get('description', '')
            else:
                desc = str(resp)
            if desc:
                parent.add_paragraph(f"• {desc}", style='ListBullet')

    def _add_education_item(self, parent, edu):
        """Add an education item"""
        # Degree and institution
        title_para = parent.add_paragraph()
        title_para.add_run(f"{edu.get('degree', '')}").bold = True
        if edu.get('institution'):
            title_para.add_run(f", {edu['institution']}")
        
        # Year and grade
        details = []
        if edu.get('year'):
            details.append(edu['year'])
        if edu.get('grade'):
            details.append(edu['grade'])
        
        if details:
            parent.add_paragraph(", ".join(details)).italic = True
        
        parent.add_paragraph()  # Add space between items

    def _add_hyperlink(self, paragraph, text, url):
        """Add a hyperlink to a paragraph"""
        try:
            part = paragraph.part
            r_id = part.relate_to(
                url, 
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink", 
                is_external=True
            )
            hyperlink = paragraph.add_run()
            hyperlink.font.color.rgb = RGBColor(0, 0, 255)
            hyperlink.font.underline = True
            hyperlink.add_text(text)
        except Exception as e:
            # Fallback: just add text without hyperlink
            paragraph.add_run(f"{text}: {url}")