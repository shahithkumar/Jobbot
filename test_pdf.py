import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jobbot.settings')
django.setup()

from jobhunter.utils import generate_pdf_from_latex

print("Testing Tectonic PDF Generation...")

# Simple minimal LaTeX
TEST_LATEX = r"""
\documentclass{article}
\usepackage[utf8]{inputenc}
\title{Test Document}
\author{JobBot}
\date{\today}
\begin{document}
\maketitle
Hello World! This is a test verified PDF.
\end{document}
"""

pdf_path = generate_pdf_from_latex(TEST_LATEX)

if pdf_path and os.path.exists(pdf_path):
    print(f"\nSUCCESS: PDF generated at: {pdf_path}")
else:
    print("\nFAILURE: PDF could not be generated.")
