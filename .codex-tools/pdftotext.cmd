@echo off
set "PDF_FILE="
for %%A in (%*) do if /I "%%~xA"==".pdf" set "PDF_FILE=%%~fA"
"C:\Users\izhar\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -c "from pypdf import PdfReader; import sys; print('\\n'.join((page.extract_text() or '') for page in PdfReader(sys.argv[1]).pages))" "%PDF_FILE%"
