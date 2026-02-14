import { TrendingUp } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer bg-slate-900 border-t border-slate-700 py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <div className="text-xl font-bold text-white">MAIN<span className="text-blue-500">STOCK</span></div>
            </div>
            <p className="text-slate-400 text-sm">
              &copy; 2024 Quantitative Analysis Engine.
            </p>
            <p className="text-slate-500 text-xs">
              Diseñado por <span className="text-slate-300 font-medium">Hector E. Garcia</span>
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-white font-semibold uppercase tracking-wider text-sm">Recursos</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Política de Privacidad</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Términos de Servicio</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Documentación</a></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-white font-semibold uppercase tracking-wider text-sm">Institucional</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Soporte</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Estado de la API</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Contacto</a></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-white font-semibold uppercase tracking-wider text-sm">Legal</h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              <strong className="text-slate-400">Disclaimer:</strong> Los datos financieros son para fines informativos únicamente. 
              El análisis generado se basa en datos históricos y no garantiza el rendimiento futuro del mercado. 
              Consulta siempre con un profesional certificado.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
