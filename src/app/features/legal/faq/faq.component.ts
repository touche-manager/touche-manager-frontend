import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FaqItem {
  question: string;
  answer: string;
  open: ReturnType<typeof signal<boolean>>;
}

interface FaqCategory {
  title: string;
  items: FaqItem[];
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './faq.component.html'
})
export class FaqComponent {
  readonly categories: FaqCategory[] = [
    {
      title: 'Esgrima — Las tres armas',
      items: [
        {
          question: '¿Cuáles son las diferencias entre florete, espada y sable?',
          answer: 'Son las tres disciplinas de la esgrima olímpica. Se diferencian en el arma utilizada, la zona del cuerpo válida para marcar toques y las reglas de prioridad.',
          open: signal(false)
        },
        {
          question: '¿Cómo funciona el florete?',
          answer: 'El florete es un arma ligera con hoja flexible de sección rectangular. La zona válida de touché es únicamente el torso (espaldas, pecho y costados). Funciona con el convencional: si ambos tiradores tocan casi al mismo tiempo, se evalúa la prioridad según quién haya iniciado el ataque primero. Los toques se registran con la punta de la hoja (empujón, no corte). Es el arma donde se desarrolla la mayor estrategia táctica.',
          open: signal(false)
        },
        {
          question: '¿Cómo funciona la espada?',
          answer: 'La espada es el arma más pesada y rígida, con hoja de sección triangular. Cualquier parte del cuerpo es zona válida de touché: pies, manos, cabeza, brazos, piernas. No hay regla de prioridad: si ambos tiradores tocan en un intervalo de 40 milisegundos (doble toque), ambos reciben un punto. Esto hace que la espada sea más defensiva y pacienciosa. El toque se registra con la punta de la hoja.',
          open: signal(false)
        },
        {
          question: '¿Cómo funciona el sable?',
          answer: 'El sable es un arma con hoja plana que permite golpes con el filo, el dorso y la punta. La zona válida de touché es todo el cuerpo por encima de la cintura (tronco, brazos, cabeza), sin incluir las manos. Es el arma más explosiva y rápida: los tiradores suelen atacar en carrera. Funciona con el convencional similar al florete para determinar prioridad. Es el arma con la tradición más marcial, derivada de los sables de caballería.',
          open: signal(false)
        },
        {
          question: '¿QuéEquipmento se usa para protegerse?',
          answer: 'Cada arma usa un cable de conexión al sistema eléctrico de pista. Florete y sable utilizan un chaleco conductor que cubre la zona válida (conexión al aparato de luz). Espada usa un cable directo sin chaleco. Todos los tiradores usan máscara con malla metálica, guante protector, babero y ropa deportiva específica (traje de esgrima). El árbitro supervisa el equipo antes del combate.',
          open: signal(false)
        }
      ]
    },
    {
      title: 'Inscripción a Torneos',
      items: [
        {
          question: '¿Cómo me inscribo a un torneo?',
          answer: 'Para inscribirte a un torneo debés seguir estos pasos: 1) Registrarte como Atleta y completar tu perfil con tus datos personales. 2) Cargar los documentos requeridos (Apto Médico vigente, Comprobante de pago de Afiliación anual). 3) Ir a la sección "Inscripciones", buscar el torneo activo y realizar el pago. Tu documentación será validada por el organizador del torneo posterior a tu inscripción.',
          open: signal(false)
        },
        {
          question: '¿Qué documentos necesito subir para poder competir?',
          answer: 'Debés presentar tu Apto Médico digitalizado (en formato PDF o imagen) que sea legible y contenga la firma y sello del profesional médico, y el comprobante de Afiliación anual del corriente año.',
          open: signal(false)
        },
        {
          question: '¿Puedo inscribirme si mis documentos están pendientes de validación?',
          answer: 'Sí. Podés realizar la inscripción y el pago sin problemas aunque tus documentos estén pendientes de revisión. Sin embargo, la validación de tus documentos es un requisito obligatorio para que el organizador pueda incluirte en el sorteo de poules y puedas competir.',
          open: signal(false)
        },
        {
          question: '¿Cómo me desinscribo de un torneo?',
          answer: 'Desde la sección de Inscripciones, tocá "Desinscribirse" en el torneo del que querés darte de baja y confirmá la acción. Si la inscripción ya fue abonada, el pago queda registrado como crédito para ese torneo: si te reinscribís más adelante, no se te cobrará un nuevo arancel. Si necesitás un reembolso monetario (devolución del dinero), debés contactar a soporte@touchemanager.com.',
          open: signal(false)
        },
        {
          question: '¿Puedo re-inscribirme después de desinscribirme?',
          answer: 'Sí. Si ya habías pagado, tu crédito se mantiene y la reinscripción es sin costo. Si aún no habías pagado, al reinscribirte se recalculará el arancel según la fecha actual (puede variar si ya pasó la fecha de inscripción regular).',
          open: signal(false)
        }
      ]
    },
    {
      title: 'Reglamento de los Asaltos',
      items: [
        {
          question: '¿Cómo se define el ganador en un asalto de Poule?',
          answer: 'En la fase de grupos o "poules", los asaltos se disputan a un máximo de 5 toques (o tocados) con un límite de tiempo de 3 minutos de combate efectivo. El tirador que llegue primero a 5 toques, o el que tenga más toques al finalizar el tiempo, gana el asalto.',
          open: signal(false)
        },
        {
          question: '¿Cómo funcionan las eliminatorias directas (Bracket)?',
          answer: 'En la fase de eliminación directa, los asaltos se juegan a 15 toques, divididos en 3 períodos de 3 minutos cada uno (con 1 minuto de descanso entre ellos). Si un tirador llega a 15 toques antes del tiempo límite, gana inmediatamente.',
          open: signal(false)
        },
        {
          question: '¿Qué pasa si hay un empate al terminar el tiempo reglamentario?',
          answer: 'Si el tiempo expira con empate, se realiza un sorteo digital de "prioridad" de 1 minuto para uno de los esgrimistas. Se combate un minuto adicional a muerte súbita: el primero en anotar gana. Si pasa el minuto sin toques, gana quien tenía la prioridad.',
          open: signal(false)
        },
        {
          question: '¿Cómo se distribuyen los tiradores en el cuadro de eliminación?',
          answer: 'Al terminar las poules, el sistema genera una clasificación general basada en: victorias sobre asaltos jugados (V/M), diferencia de toques dados y recibidos (TD-TR), y toques dados (TD). Con esta clasificación se siembra el bracket, enfrentando al mejor clasificado con el peor.',
          open: signal(false)
        }
      ]
    },
    {
      title: 'Arbitraje y Uso del Marcador',
      items: [
        {
          question: '¿Quién registra los toques de los combates?',
          answer: 'Los toques son registrados por el Árbitro asignado al asalto a través del marcador digital en tiempo real de Touché Manager. El árbitro controla el cronómetro, registra las tarjetas de amonestación y valida los toques de acuerdo con el reglamento FIE.',
          open: signal(false)
        },
        {
          question: '¿Cómo puedo seguir el estado del torneo en vivo?',
          answer: 'Cualquier persona puede ingresar como espectador a la aplicación para ver el progreso del torneo en tiempo real. Esto incluye la clasificación en vivo durante las poules, el estado del bracket y las pistas asignadas, así como el marcador toque a toque de los combates en curso.',
          open: signal(false)
        }
      ]
    }
  ];

  toggle(item: FaqItem): void {
    item.open.update(v => !v);
  }
}
