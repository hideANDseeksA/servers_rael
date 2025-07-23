import sys
import os
import subprocess
from zipfile import ZipFile
import shutil
import tempfile

# Get CLI arguments
input_path = sys.argv[1]
output_path = sys.argv[2]
name_value = sys.argv[3]
office_value = sys.argv[4]
division_value = sys.argv[5]  # NEW

# Step 1: Unzip DOCX
temp_dir = tempfile.mkdtemp()
with ZipFile(input_path, 'r') as zip_in:
    zip_in.extractall(temp_dir)

# Step 2: Replace placeholders
document_xml = os.path.join(temp_dir, 'word', 'document.xml')
with open(document_xml, 'r', encoding='utf-8') as f:
    xml_content = f.read()

xml_content = xml_content.replace('{{name}}', name_value)
xml_content = xml_content.replace('{{from}}', office_value)
xml_content = xml_content.replace('{{division}}', division_value)  # NEW

with open(document_xml, 'w', encoding='utf-8') as f:
    f.write(xml_content)

# Step 3: Repackage DOCX
modified_docx = os.path.join(os.path.dirname(output_path), 'modified.docx')
with ZipFile(modified_docx, 'w') as zip_out:
    for root, dirs, files in os.walk(temp_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, temp_dir)
            zip_out.write(file_path, arcname)

# Step 4: Convert to PDF

subprocess.run([
    'soffice', '--headless', '--convert-to', 'pdf',
    '--outdir', os.path.dirname(output_path),
    modified_docx
], check=True)



# Step 5: Rename and cleanup
generated_pdf = modified_docx.replace('.docx', '.pdf')
if os.path.exists(output_path):
    os.remove(output_path)
os.rename(generated_pdf, output_path)

shutil.rmtree(temp_dir)

print("[OK] PDF generated:", output_path)
print("DEBUG VALUES:")
print("name_value:", name_value)
print("school_or_office:", office_value)
print("division_value:", division_value)

