import React from "react";
import ZetaLogo from "./ZetaLogo";

export default function Footer() {
  return (
    <footer className="w-full bg-[#f4f7fc] border-t border-slate-200 pt-12 pb-8 mt-16">
      <div className="container mx-auto max-w-[1400px] px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4 text-[1.25rem] font-bold text-slate-900">
              <ZetaLogo className="w-8 h-8 text-slate-800" />
              <span>
                Block<span className="text-blue-600">Stock</span>
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              &copy; 2024 Quantitative Analysis Engine.
            </p>
            <p className="text-slate-500 text-sm leading-relaxed">
              Diseñado por <span className="text-slate-900 font-medium">Hector E. Garcia</span>
            </p>
          </div>

          <div>
            <h4 className="text-slate-900 text-base font-semibold mb-6">Recursos</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-slate-500 text-sm hover:text-blue-600 transition-colors">
                  Política de Privacidad
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-500 text-sm hover:text-blue-600 transition-colors">
                  Términos de Servicio
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-500 text-sm hover:text-blue-600 transition-colors">
                  Documentación
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 text-base font-semibold mb-6">Institucional</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-slate-500 text-sm hover:text-blue-600 transition-colors">
                  Soporte
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-500 text-sm hover:text-blue-600 transition-colors">
                  Estado de la API
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-500 text-sm hover:text-blue-600 transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 text-base font-semibold mb-6">Legal</h4>
            <p className="text-slate-500 text-sm leading-relaxed">
              <strong>Disclaimer:</strong> Los datos financieros son para fines informativos únicamente. 
              El análisis generado se basa en datos históricos y no garantiza el rendimiento futuro del mercado. 
              Consulta siempre con un profesional certificado.
            </p>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-200 text-center text-slate-500 text-xs">
          Data provided by Yahoo Finance (via Proxy) | USE AT OWN RISK
        </div>
      </div>
    </footer>
  );
}
