#!/usr/bin/env python3
import markdown
import weasyprint
import sys
import os

def convert_md_to_pdf(md_file, pdf_file):
    # Read markdown file
    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()

    # Convert to HTML
    html_content = markdown.markdown(md_content, extensions=['tables', 'fenced_code', 'codehilite'])

    # Add basic CSS for better formatting
    html_with_css = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>DTC-SYS Project Summary</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; }}
            h1 {{ color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }}
            h2 {{ color: #34495e; margin-top: 30px; }}
            h3 {{ color: #7f8c8d; }}
            pre {{ background-color: #f8f8f8; padding: 10px; border-radius: 5px; }}
            code {{ background-color: #f1f1f1; padding: 2px 4px; border-radius: 3px; }}
            table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
            th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
            th {{ background-color: #f2f2f2; }}
            ul, ol {{ margin: 10px 0; }}
            li {{ margin: 5px 0; }}
        </style>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    """

    # Convert to PDF
    weasyprint.HTML(string=html_with_css).write_pdf(pdf_file)
    print(f"PDF generated: {pdf_file}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_md_to_pdf.py input.md output.pdf")
        sys.exit(1)

    md_file = sys.argv[1]
    pdf_file = sys.argv[2]

    if not os.path.exists(md_file):
        print(f"Error: {md_file} not found")
        sys.exit(1)

    convert_md_to_pdf(md_file, pdf_file)