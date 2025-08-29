#!/usr/bin/env python3
import sys
from pathlib import Path

def main():
    if len(sys.argv) < 3:
        print("Usage: extract_pdf_text.py <input.pdf> <output.txt>")
        sys.exit(1)
    inp = Path(sys.argv[1])
    outp = Path(sys.argv[2])
    try:
        from pdfminer.high_level import extract_text
        text = extract_text(str(inp))
    except Exception as e:
        # Fallback to PyPDF2 if pdfminer fails
        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(str(inp))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e2:
            sys.stderr.write(f"Failed to extract text: {e}\nFallback failed: {e2}\n")
            sys.exit(2)
    outp.parent.mkdir(parents=True, exist_ok=True)
    outp.write_text(text or "", encoding='utf-8')
    print(f"Wrote {outp}")

if __name__ == "__main__":
    main()

