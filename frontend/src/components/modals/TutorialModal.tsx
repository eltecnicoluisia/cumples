import React, { useState } from 'react';
import { 
  X, 
  Network, 
  Link, 
  CalendarDays, 
  MousePointerClick, 
  ChevronRight, 
  ChevronLeft, 
  Lightbulb,
  Zap,
  Heart,
  MessageCircle,
  Users,
  Database,
  FolderTree
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      title: "Manual de Uso — Bienvenida",
      subtitle: "¿Cómo empezar a construir tu historia?",
      icon: <Network className="w-12 h-12 text-emerald-400" />,
      content: (
        <div className="text-sm text-slate-300 text-center px-4 space-y-2">
          <p>
            Bienvenido al <strong>Manual de Uso de CUMPLES</strong>. Esta plataforma fue diseñada para construir tu árbol genealógico y mantener viva la memoria familiar.
          </p>
          <p className="text-xs text-slate-400">
            Recomendamos iniciar registrando a las generaciones más antiguas (abuelos o bisabuelos) usando el botón <strong className="text-emerald-400">+ Nuevo Familiar</strong>.
          </p>
        </div>
      ),
      color: "from-emerald-500/20 to-teal-500/5",
      borderColor: "border-emerald-500/30"
    },
    {
      title: "⚡ Autocompletado Inteligente",
      subtitle: "Ahorra tiempo enviando la plantilla por WhatsApp",
      icon: <Zap className="w-12 h-12 text-amber-400" />,
      content: (
        <div className="text-sm text-slate-300 px-4 space-y-2.5">
          <p className="text-center font-semibold text-amber-300">
            ¡No escribas todo manualmente! Usa la función inteligente:
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-300 text-left">
            <li>Al abrir <strong>"+ Nuevo Familiar"</strong>, presiona <strong>"Copiar Plantilla WhatsApp"</strong>.</li>
            <li>Envíale esa plantilla a tu familiar para que responda con sus datos.</li>
            <li>Copia la respuesta del familiar, regresa a GeneaTrack y presiona <strong>"⚡ Pegar Datos"</strong>.</li>
            <li>El sistema reconocerá automáticamente los nombres, fechas, apodos y teléfono rellenando las casillas al instante.</li>
          </ol>
        </div>
      ),
      color: "from-amber-500/20 to-orange-500/5",
      borderColor: "border-amber-500/30"
    },
    {
      title: "🔗 Vinculación de Parentesco y Linajes",
      subtitle: "Unir parejas y padres con hijos",
      icon: <Link className="w-12 h-12 text-sky-400" />,
      content: (
        <div className="text-sm text-slate-300 px-4 space-y-2 text-left text-xs">
          <p className="text-center font-bold text-sky-300 mb-1">
            Cada persona en el árbol se dibuja una sola vez sin duplicados confusos.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Para unir parejas:</strong> Abre el perfil de una persona ➔ <em>Vincular Parentesco</em> ➔ selecciona <em>Matrimonio / Pareja</em>.</li>
            <li><strong>Para agregar hijos:</strong> Abre el perfil del padre/madre ➔ <em>Vincular Parentesco</em> ➔ selecciona <em>Padre/Madre ➔ Hijo</em>.</li>
            <li><strong>Medios Hermanos / Varias Parejas:</strong> El sistema soporta múltiples matrimonios por persona, vinculando a cada hijo con sus padres biológicos exactos.</li>
          </ul>
        </div>
      ),
      color: "from-sky-500/20 to-blue-500/5",
      borderColor: "border-sky-500/30"
    },
    {
      title: "🚨 Alertas Tempranas (Víspera y Hoy)",
      subtitle: "Notificaciones de Cumpleaños y Conmemoraciones",
      icon: <CalendarDays className="w-12 h-12 text-pink-400" />,
      content: (
        <div className="text-sm text-slate-300 px-4 space-y-2 text-left text-xs">
          <p className="text-center font-bold text-pink-300 mb-1">
            Nunca olvides una fecha especial en la familia.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Alertas de Víspera (1 día antes):</strong> La app te avisa <em>mañana</em> con un banner parpadeante y un número en la barra superior.</li>
            <li><strong>Cumpleaños de Vivos y Fallecidos:</strong> Felicitaciones a los vivos y homenajes en la fecha de nacimiento de quienes ya no están.</li>
            <li><strong>Aniversarios Luctuosos y de Matrimonio:</strong> Conmemoración de partida física y bodas.</li>
            <li><strong>Hitos Especiales:</strong> Graduaciones, bautizos y logros familiares.</li>
          </ul>
        </div>
      ),
      color: "from-pink-500/20 to-rose-500/5",
      borderColor: "border-pink-500/30"
    },
    {
      title: "📲 Compartir en WhatsApp en 1 Clic",
      subtitle: "Felicitaciones y Homenajes Listos para Enviar",
      icon: <MessageCircle className="w-12 h-12 text-emerald-400" />,
      content: (
        <div className="text-sm text-slate-300 px-4 space-y-2 text-center text-xs">
          <p className="font-bold text-emerald-300">
            Mensajes formateados automáticamente con emojis y detalles.
          </p>
          <p>
            Al presionar el botón <strong>"Compartir por WhatsApp"</strong> en cualquier tarjeta de evento o perfil, GeneaTrack redactará una hermosa dedicatoria incluyendo el nombre, la edad a cumplir, el signo zodiacal o los años transcurridos, lista para enviar a tus grupos familiares.
          </p>
        </div>
      ),
      color: "from-emerald-500/20 to-teal-500/5",
      borderColor: "border-emerald-500/30"
    },
    {
      title: "🌳 Multi-Árboles Genealógicos",
      subtitle: "Crea y gestiona varios árboles por separado",
      icon: <FolderTree className="w-12 h-12 text-emerald-400" />,
      content: (
        <div className="text-sm text-slate-300 px-4 space-y-2 text-left text-xs">
          <p className="text-center font-bold text-emerald-300 mb-1">
            Puedes tener varios árboles familiares independientes en tu cuenta.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Selector de Árbol:</strong> Haz clic en la barra superior al lado del logo de <strong>GeneaTrack</strong>.</li>
            <li><strong>Crear Nuevo Árbol:</strong> Presiona <em>"+ Crear Nuevo Árbol"</em> para separar tu árbol en <strong>Linaje Paterno</strong> y <strong>Linaje Materno</strong>.</li>
            <li><strong>Cambio Inmediato:</strong> Alterna entre tus distintos árboles en 1 segundo con su propia base de datos y estadísticas independientes.</li>
          </ul>
        </div>
      ),
      color: "from-emerald-500/20 to-teal-500/5",
      borderColor: "border-emerald-500/30"
    },
    {
      title: "🛡️ Enfoque de Linaje (Paterno vs Materno)",
      subtitle: "Resalta o aísla ramas en el lienzo",
      icon: <Users className="w-12 h-12 text-sky-400" />,
      content: (
        <div className="text-sm text-slate-300 px-4 space-y-2 text-left text-xs">
          <p className="text-center font-bold text-sky-300 mb-1">
            Visualiza solo la línea que desees en tu árbol actual.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>[👨 Paterno]:</strong> Ilumina la rama paterna (padre, abuelos paternos, bisabuelos) y oculta a los parientes de la madre.</li>
            <li><strong>[👩 Materno]:</strong> Ilumina la rama materna (madre, abuelos maternos, bisabuelos) y oculta a los parientes del padre.</li>
            <li><strong>[🌳 Todos]:</strong> Vuelve a mostrar el lienzo consolidado completo.</li>
          </ul>
        </div>
      ),
      color: "from-sky-500/20 to-blue-500/5",
      borderColor: "border-sky-500/30"
    },
    {
      title: "🔍 Filtros de Linaje y Respaldos",
      subtitle: "Control total de la información",
      icon: <Database className="w-12 h-12 text-purple-400" />,
      content: (
        <div className="text-sm text-slate-300 px-4 space-y-2 text-left text-xs">
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Filtro por Apellido:</strong> En la barra del árbol, usa el selector <em>Familia</em> para aislar una rama específica (ej. Linaje Uzcátegui).</li>
            <li><strong>Zoom y Arrastre:</strong> Arrastra el fondo con el ratón o usa pellizcar/rueda para Zoom.</li>
            <li><strong>Respaldos de Seguridad:</strong> Entra a la pestaña <em>Respaldos</em> para descargar una copia JSON de todo tu árbol y resguardar tu historia.</li>
          </ul>
        </div>
      ),
      color: "from-purple-500/20 to-indigo-500/5",
      borderColor: "border-purple-500/30"
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide(curr => curr + 1);
    else onClose();
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(curr => curr - 1);
  };

  const slide = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full max-w-lg bg-slate-900 border ${slide.borderColor} rounded-3xl shadow-2xl overflow-hidden transition-colors duration-500`}>
        
        {/* Fondo decorativo */}
        <div className={`absolute inset-0 bg-gradient-to-b ${slide.color} opacity-50 pointer-events-none transition-colors duration-500`} />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-300">
              Manual de Uso ({currentSlide + 1} de {slides.length})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Slide */}
        <div className="relative px-6 pb-6 pt-2 min-h-[300px] flex flex-col items-center justify-center">
          <div className="mb-4 p-3.5 bg-slate-950/50 rounded-2xl shadow-lg border border-slate-800">
            {slide.icon}
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white text-center mb-0.5">{slide.title}</h2>
          <h3 className="text-xs font-bold text-slate-400 text-center mb-4 uppercase tracking-wider">{slide.subtitle}</h3>
          
          <div className="w-full flex-1 flex flex-col justify-center">
            {slide.content}
          </div>
        </div>

        {/* Navegación y Paginación */}
        <div className="relative px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold transition-all ${
              currentSlide === 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Atrás
          </button>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentSlide ? 'bg-amber-400 w-5' : 'bg-slate-700 w-2'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl flex items-center gap-1 text-xs font-black shadow-lg transition-all"
          >
            {currentSlide === slides.length - 1 ? '¡Finalizar!' : 'Siguiente'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
