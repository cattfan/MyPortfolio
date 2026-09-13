"""Generate the bilingual, one-page CV from verified portfolio content.

Run with scripts/requirements-assets.txt installed. Original font licenses live
in apps/web/app/fonts. No employment dates or unverified usage metrics are added.
"""
from pathlib import Path
from xml.sax.saxutils import escape
import shutil
import subprocess
import json
from fontTools.ttLib import TTFont as Font
from fontTools.varLib.instancer import instantiateVariableFont
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
FONTS = ROOT / 'apps/web/app/fonts'
TEMP = ROOT / 'tmp/pdfs'
OUTPUT = ROOT / 'output/pdf'
PUBLIC = ROOT / 'apps/web/public/cv'
for folder in [TEMP, OUTPUT, PUBLIC]: folder.mkdir(parents=True, exist_ok=True)
for name, weight in [('CVBody',400), ('CVBold',600)]:
    font = Font(FONTS/'Geist-Regular.ttf')
    font = instantiateVariableFont(font, {'wght':weight}, inplace=True)
    font.save(TEMP/f'{name}.ttf')
    pdfmetrics.registerFont(TTFont(name, str(TEMP/f'{name}.ttf')))
pdfmetrics.registerFontFamily('CVBody',normal='CVBody',bold='CVBold')
font = Font(FONTS/'SourceSerif4-Regular.ttf')
font = instantiateVariableFont(font, {'wght':400,'opsz':32}, inplace=True)
font.save(TEMP/'CVTitle.ttf')
pdfmetrics.registerFont(TTFont('CVTitle',str(TEMP/'CVTitle.ttf')))
portfolio = json.loads(subprocess.check_output([
    'node','--input-type=module','-e',
    "import {portfolio,projects,techStack} from './apps/web/content/portfolio.ts';process.stdout.write(JSON.stringify({portfolio,projects,techStack}));"
],cwd=ROOT,encoding='utf-8'))
person=portfolio['portfolio']
ink=colors.HexColor('#282b27');muted=colors.HexColor('#525b54');accent=colors.HexColor('#42604e')
styles={
    'title':ParagraphStyle('title',fontName='CVTitle',fontSize=31,leading=37,textColor=ink,spaceAfter=4),
    'role':ParagraphStyle('role',fontName='CVBold',fontSize=12,leading=18,textColor=accent,spaceAfter=10),
    'contact':ParagraphStyle('contact',fontName='CVBody',fontSize=9,leading=14,textColor=muted,spaceAfter=2),
    'heading':ParagraphStyle('heading',fontName='CVBold',fontSize=11,leading=16,textColor=accent,spaceBefore=17,spaceAfter=8),
    'body':ParagraphStyle('body',fontName='CVBody',fontSize=9.7,leading=15,textColor=ink,spaceAfter=7),
    'project':ParagraphStyle('project',fontName='CVBold',fontSize=11,leading=17,textColor=ink,spaceBefore=8,spaceAfter=3),
    'stack':ParagraphStyle('stack',fontName='CVBody',fontSize=9,leading=14,textColor=muted,spaceAfter=8),
}
content={
 'vi':{
  'location':'Đà Lạt, Việt Nam','summary':'Giới thiệu',
  'about':'Software Engineer với 2 năm kinh nghiệm phát triển web và ứng dụng desktop. Phụ trách giao diện, backend, cơ sở dữ liệu và triển khai trong các dự án Riviu. Thích tìm hiểu nguyên nhân của vấn đề, trao đổi bằng ví dụ cụ thể và kiểm tra lại sản phẩm sau khi hoàn thành.',
  'skills':'Công nghệ sử dụng','projects':'Dự án tiêu biểu','role':'Vai trò: Phát triển toàn bộ sản phẩm',
  'manager':[
    'Phát triển phần mềm quản lý nhiều thiết bị Android và iOS: theo dõi màn hình, điều khiển thiết bị và tạo kịch bản thao tác bằng trình Flow.',
    'Tách phần kết nối thiết bị và thực thi kịch bản trong Rust khỏi giao diện React. Đóng gói các thành phần cần thiết cùng ứng dụng Tauri để giảm thao tác cài đặt.',
  ],
  'web':[
    'Phát triển website thương hiệu, trang dịch vụ, bảng giá và biểu mẫu liên hệ; xây trang quản trị nội dung và dashboard thống kê truy cập.',
    'Tách frontend Next.js và API NestJS, lưu dữ liệu bằng PostgreSQL/Prisma. Tích hợp Puck để chỉnh sửa và xuất bản nội dung trang, triển khai bằng Docker và Nginx.',
  ],
  'links':'Liên kết','live':'Website đang hoạt động','code':'Mã nguồn portfolio',
 },
 'en':{
  'location':'Da Lat, Vietnam','summary':'Profile',
  'about':'Software Engineer with two years of experience building web and desktop applications. Responsible for interfaces, backend services, databases and deployment in Riviu projects. I enjoy finding the cause of a problem, discussing concrete examples and testing the finished product.',
  'skills':'Technical skills','projects':'Selected projects','role':'Role: Full product development',
  'manager':[
    'Built desktop software for managing multiple Android and iOS devices, with screen monitoring, device control and a visual Flow editor for repeatable workflows.',
    'Separated device connections and workflow execution in Rust from the React interface. Bundled required components with the Tauri application to reduce installation steps.',
  ],
  'web':[
    'Built the brand website, service and pricing pages, contact forms, content administration and a traffic analytics dashboard.',
    'Separated the Next.js frontend and NestJS API, using PostgreSQL and Prisma for storage. Integrated Puck for editing and publishing page content, and deployed with Docker and Nginx.',
  ],
  'links':'Links','live':'Live website','code':'Portfolio source code',
 }
}
for language,c in content.items():
    elements=[]
    def p(text,style='body'):elements.append(Paragraph(text,styles[style]))
    p(escape(person['name']),'title');p('Software Engineer','role')
    p(c['location']+'  |  '+person['phone'],'contact')
    p(f'<link href="mailto:{person["email"]}">{person["email"]}</link>  |  <link href="{person["github"]}">github.com/cattfan</link>','contact')
    elements.extend([Spacer(1,12),HRFlowable(width='100%',thickness=.6,color=colors.HexColor('#cad1cb'))])
    p(c['summary'],'heading');p(c['about'])
    p(c['skills'],'heading')
    for label,value in [
        ('Frontend','TypeScript, React, Next.js, Tailwind CSS'),
        ('Backend &amp; data','Node.js, NestJS, REST API, PostgreSQL, SQL, Prisma'),
        ('Desktop','Rust, Tauri, React Flow'),
        ('Tools','Docker, Nginx, Linux, Git, GitHub, Playwright'),
    ]: p(f'<b>{label}</b>  {value}','stack')
    p(c['projects'],'heading')
    for name,key,stack in [('Riviu Manager','manager','Tauri, Rust, React, TypeScript, React Flow'),('Riviu Web','web','Next.js, NestJS, PostgreSQL, Prisma, Puck')]:
        p(name,'project');p(c['role'],'stack')
        for item in c[key]:p(item)
        p(stack,'stack')
    p(c['links'],'heading')
    p(f'{c["live"]}: <link href="https://taskscatt.click/">taskscatt.click</link><br/>{c["code"]}: <link href="https://github.com/cattfan/MyPortfolio">github.com/cattfan/MyPortfolio</link>','contact')
    target=OUTPUT/f'do-hien-dinh-{language}.pdf'
    doc=SimpleDocTemplate(str(target),pagesize=A4,leftMargin=46,rightMargin=46,topMargin=36,bottomMargin=34,title='Đỗ Hiền Dinh - Software Engineer',author=person['name'])
    doc.build(elements)
    reader=PdfReader(target);assert len(reader.pages)==1
    text=''.join(page.extract_text() for page in reader.pages)
    assert person['name'] in text and person['email'] in text and 'Riviu Manager' in text and 'Riviu Web' in text
    shutil.copy2(target,PUBLIC/target.name)
    print(f'RESUME_PASS: {target.name}; one page; selectable Vietnamese text; {target.stat().st_size} bytes')
