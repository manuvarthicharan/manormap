import re

with open(r'c:\Users\mkcha\Downloads\New folder\New folder\converted_jsx.txt', 'r', encoding='utf-8') as f:
    jsx = f.read()

# 1. Clean up remaining HTML comments
jsx = re.sub(r'<!--(.*?)-->', r'{/* \1 */}', jsx)

# 2. Fix the mobile menu button icon
menu_button_old = '''<button
          id="mobile-menu-btn"
          type="button"
          aria-expanded="false"
          aria-label="Toggle navigation menu"
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <i id="menu-icon-open" data-lucide="menu" className="w-5 h-5"></i>
          <i id="menu-icon-close" data-lucide="x" className="hidden w-5 h-5"></i>
        </button>'''

menu_button_new = '''<button
          type="button"
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Menu className="w-5 h-5" aria-hidden="true" />
          )}
        </button>'''

if menu_button_old in jsx:
    jsx = jsx.replace(menu_button_old, menu_button_new)
    print("Replaced mobile menu button cleanly.")
else:
    print("Mobile menu button exact match not found, applying regex replace...")
    jsx = re.sub(
        r'<button\s+id="mobile-menu-btn".*?</button>',
        menu_button_new,
        jsx,
        flags=re.DOTALL
    )

# 3. Replace mobile menu drawer styling and binding
drawer_old = '<div id="mobile-menu-drawer" className="md:hidden border-b border-slate-200/80 bg-white/95 backdrop-blur-md">'
drawer_new = '<div className={`md:hidden border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all duration-300 ${mobileMenuOpen ? "block" : "hidden"}`}'
jsx = jsx.replace(drawer_old, drawer_new)

# 4. Replace logo <img> with our MapEstate logo component/img
logo_brand_old = '''<a href="#" className="flex items-center gap-2.5 rounded-lg">
        <img
          src="./logo.png"
          alt="MapEstate Logo"
          className="h-7 w-7 object-contain shrink-0"
          onerror="this.classList.add('hidden'); this.nextElementSibling.classList.remove('hidden');"
        />
        {/* Clean architectural SVG fallback if ./logo.png is not present */}
        <svg className="hidden h-7 w-7 shrink-0 text-slate-900" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="2" y="2" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="1.75" />
          <path d="M2 12H26M12 2V26" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.22" />
          <rect x="14" y="14" width="9" height="9" rx="2" fill="#059669" fillOpacity="0.16" stroke="#059669" strokeWidth="1.75" />
          <circle cx="18.5" cy="18.5" r="1.75" fill="#059669" />
        </svg>
        <span className="font-display font-semibold text-lg tracking-display text-slate-900">MapEstate</span>
      </a>'''

logo_brand_new = '''<a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center gap-2.5 rounded-lg group">
        <img
          src={logoImg}
          alt="MapEstate Logo"
          className="h-8 sm:h-9 w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
        />
      </a>'''

if logo_brand_old in jsx:
    jsx = jsx.replace(logo_brand_old, logo_brand_new)
    print("Replaced header logo brand.")
else:
    print("Header logo exact match not found, checking with regex...")
    jsx = re.sub(r'<a href="#" className="flex items-center gap-2\.5 rounded-lg">.*?<span className="font-display font-semibold text-lg tracking-display text-slate-900">MapEstate</span>\s*</a>', logo_brand_new, jsx, flags=re.DOTALL)

# Footer logo
footer_logo_old = '''<div className="flex items-center gap-2.5">
            <img
              src="./logo.png"
              alt="MapEstate Logo"
              className="h-7 w-7 object-contain shrink-0"
              onerror="this.classList.add('hidden'); this.nextElementSibling.classList.remove('hidden');"
            />
            <svg className="hidden h-7 w-7 shrink-0 text-slate-900" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="2" y="2" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="1.75" />
              <path d="M2 12H26M12 2V26" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.22" />
              <rect x="14" y="14" width="9" height="9" rx="2" fill="#059669" fillOpacity="0.16" stroke="#059669" strokeWidth="1.75" />
              <circle cx="18.5" cy="18.5" r="1.75" fill="#059669" />
            </svg>
            <span className="font-display font-semibold text-lg tracking-display text-slate-900">MapEstate</span>
          </div>'''

footer_logo_new = '''<div className="flex items-center gap-2.5">
            <img
              src={logoImg}
              alt="MapEstate Logo"
              className="h-8 sm:h-9 w-auto object-contain shrink-0"
            />
          </div>'''

if footer_logo_old in jsx:
    jsx = jsx.replace(footer_logo_old, footer_logo_new)
    print("Replaced footer logo.")
else:
    print("Footer logo exact match not found, checking with regex...")
    jsx = re.sub(r'<div className="flex items-center gap-2\.5">\s*<img\s+src="\./logo\.png".*?<span className="font-display font-semibold text-lg tracking-display text-slate-900">MapEstate</span>\s*</div>', footer_logo_new, jsx, flags=re.DOTALL)

# Replace data-open-modal triggers
# Replace data-open-modal="open-map" with onClick={() => setModalType('open-map')}
jsx = re.sub(r'data-open-modal=["\']open-map["\']', 'onClick={() => setModalType("open-map")}', jsx)
jsx = re.sub(r'data-open-modal=["\']list-land["\']', 'onClick={() => setModalType("list-land")}', jsx)
jsx = re.sub(r'data-open-modal=["\']login["\']', 'onClick={() => setModalType("login")}', jsx)
jsx = re.sub(r'data-open-modal=["\']privacy["\']', 'onClick={() => setModalType("privacy")}', jsx)
jsx = re.sub(r'data-open-modal=["\']terms["\']', 'onClick={() => setModalType("terms")}', jsx)

# Replace onerror attribute on Unsplash images to valid React onError
def fix_onerror(m):
    fallback_url = m.group(1)
    return f'onError={{(e) => {{ (e.currentTarget as HTMLImageElement).src = "{fallback_url}"; }}}}'

jsx = re.sub(r'onerror="this\.onerror=null;\s*this\.src=\'([^\']+)\';?"', fix_onerror, jsx)

# Replace header ID and styling
header_old = '<header id="site-header" className="sticky top-0 z-40 w-full bg-white/75 border-b border-transparent">'
header_new = '<header id="site-header" className={`sticky top-0 z-40 w-full transition-all duration-300 ${isScrolled ? "bg-white/90 backdrop-blur-md border-b border-slate-200/90 shadow-sm" : "bg-white/75 border-b border-transparent"}`}'
jsx = jsx.replace(header_old, header_new)

with open(r'c:\Users\mkcha\Downloads\New folder\New folder\jsx_body_ready.txt', 'w', encoding='utf-8') as out:
    out.write(jsx)

print('Wrote jsx_body_ready.txt, len:', len(jsx))
