import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";


import { navItems } from "@/lib/navigation";


export default function TopNavigation() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(13,17,23,0.95)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.08)]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Brand */}
          <a href="/dashboard" className="flex items-center gap-2 text-decoration-none flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <defs>
                <linearGradient id="logo-gradient-react" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#2ea043', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#238636', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <rect x="3" y="12" width="4" height="9" rx="1" fill="url(#logo-gradient-react)"/>
              <rect x="10" y="6" width="4" height="15" rx="1" fill="url(#logo-gradient-react)"/>
              <rect x="17" y="3" width="4" height="18" rx="1" fill="url(#logo-gradient-react)"/>
            </svg>
            <span className="font-heading text-[1.25rem] font-bold text-slate-900 leading-none">
              MAIN<span className="text-[#238636]">STOCK</span>
            </span>
          </a>

          {/* Navigation Links - Centered */}
          <div className="flex items-center justify-center flex-1">
            <div className="flex items-center gap-6">
              {navItems.map((item) => {
                const isActive = item.isExternal 
                  ? false 
                  : location === item.path || location.startsWith(item.path);
                
                return (
                  <a
                    key={item.path}
                    href={item.isExternal ? item.path : undefined}
                    onClick={(e) => {
                      if (!item.isExternal) {
                        e.preventDefault();
                        setLocation(item.path);
                      }
                    }}
                    className={`flex items-center gap-2 text-[0.875rem] font-semibold transition-colors whitespace-nowrap leading-none min-w-[120px] justify-center ${
                      isActive 
                        ? "text-[#238636]" 
                        : "text-[#8b949e] hover:text-[#2ea043]"
                    }`}
                  >
                    {item.icon && <item.icon className="w-5 h-5 text-current" />}
                    <span className="hidden md:inline">{item.label}</span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-[rgba(35,134,54,0.2)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center font-bold text-[#2ea043] text-sm">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden lg:inline text-sm text-slate-900 font-semibold">{user.name}</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
