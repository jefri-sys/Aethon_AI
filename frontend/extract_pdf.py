import PyPDF2

def extract_text(pdf_path):
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text()
        return text

if __name__ == "__main__":
    text = extract_text('_Aethon_Project_Description_Updated.pdf')
    with open('pdf_content.txt', 'w', encoding='utf-8') as out:
        out.write(text)
    print("Extraction complete")
