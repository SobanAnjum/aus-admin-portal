import { HelpCircle, Calendar, Users, Edit3, ShieldCheck } from 'lucide-react';
import { Language, translations } from '../../lib/translations.ts';

interface HelpCenterViewProps {
  lang: Language;
}

export default function HelpCenterView({ lang }: HelpCenterViewProps) {
  const t = translations[lang];

  const helpTopics = [
    {
      icon: Edit3,
      q: '1. Wie bearbeite oder verschiebe ich einen Termin?',
      a: 'Wählen Sie den Termin im Kalender oder in der Übersicht aus. Klicken Sie im rechten Detail-Inspektor auf den Button "Termin bearbeiten / verschieben". Im erscheinenden Fenster können Sie Datum, Start- und Endzeit, Status (Bestätigt, Verschoben, Storniert) und den zuständigen Berater anpassen.',
    },
    {
      icon: Calendar,
      q: '2. Wie storniere oder bestätige ich Termine mit einem Klick?',
      a: 'Im Detail-Inspektor finden Sie am unteren Rand Schnell-Aktionsschaltflächen: "Als Bestätigt markieren", "Verschieben" oder "Stornieren". Der Status wird sofort im System und in den Kennzahlen aktualisiert.',
    },
    {
      icon: Users,
      q: '3. Wie synchronisieren sich Buchungen aus dem Kunden-Portal?',
      a: 'Sobald ein Kunde auf der Website ein Beratungsfeld auswählt und einen Termin bucht, wird automatisch ein Mandantendatensatz angelegt und der Termin im Status "Bestätigt" auf Ihrem Dashboard und im Kalender hinterlegt.',
    },
    {
      icon: ShieldCheck,
      q: '4. Wie füge ich Dokumente oder Besprechungsprotokolle an?',
      a: 'Wählen Sie den gewünschten Termin aus und tragen Sie im Bereich "Dokumente & Belege" den Dateinamen ein. Klicken Sie anschließend auf "Anhängen".',
    },
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-50">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <span>Mitarbeiter-Hilfecenter & Kanzlei-Leitfaden</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Anleitungen zur effizienten Nutzung des Termin- und Mandantenverwaltungssystems.
        </p>
      </div>

      <div className="space-y-4 max-w-3xl">
        {helpTopics.map((topic, i) => {
          const IconComp = topic.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <IconComp className="w-4 h-4 text-blue-600" />
                <span>{topic.q}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">
                {topic.a}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
