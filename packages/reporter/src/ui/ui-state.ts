/**
 * Máquina de Estados Global para el Frontend de QAP v3.0 (Reglas 6 y 7).
 *
 * Fuente de verdad técnica: qap-v3-architect/SKILL.md
 * - Regla 6: Única fuente de verdad para el estado de la UI (sin useState local para drawers/modales).
 * - Regla 7: Transición atómica de navegación (NAVIGATE_TO_VIEW limpia atómicamente modales y drawers).
 */

export type ActiveView = 'architecture' | 'flow' | 'telemetry' | 'guardrails';

export interface SelectedEntity {
  type: 'module' | 'capability' | 'flow' | 'run';
  id: string;
  data?: unknown;
}

export type ActiveDrawer = 'inspector' | 'filter' | null;
export type ActiveModal = 'settings' | 'confirm-delete' | null;

export interface UIState {
  activeView: ActiveView;
  selectedEntity: SelectedEntity | null;
  activeDrawer: ActiveDrawer;
  modal: ActiveModal;
}

export type UIAction =
  | { type: 'NAVIGATE_TO_VIEW'; view: ActiveView }
  | { type: 'SELECT_ENTITY'; entity: SelectedEntity; openInspector?: boolean }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'OPEN_DRAWER'; drawer: 'inspector' | 'filter' }
  | { type: 'CLOSE_DRAWER' }
  | { type: 'OPEN_MODAL'; modal: 'settings' | 'confirm-delete' }
  | { type: 'CLOSE_MODAL' };

export const INITIAL_UI_STATE: UIState = {
  activeView: 'architecture',
  selectedEntity: null,
  activeDrawer: null,
  modal: null,
};

/**
 * Reducer puro gobernando todas las transiciones visuales de la interfaz.
 */
export function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'NAVIGATE_TO_VIEW':
      // Regla 7: Transición atómica que resetea modales, drawers y selección en la misma mutación
      return {
        ...state,
        activeView: action.view,
        selectedEntity: null,
        activeDrawer: null,
        modal: null,
      };

    case 'SELECT_ENTITY':
      return {
        ...state,
        selectedEntity: action.entity,
        activeDrawer: action.openInspector ? 'inspector' : state.activeDrawer,
      };

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedEntity: null,
        activeDrawer: state.activeDrawer === 'inspector' ? null : state.activeDrawer,
      };

    case 'OPEN_DRAWER':
      return {
        ...state,
        activeDrawer: action.drawer,
      };

    case 'CLOSE_DRAWER':
      return {
        ...state,
        activeDrawer: null,
      };

    case 'OPEN_MODAL':
      return {
        ...state,
        modal: action.modal,
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        modal: null,
      };

    default:
      return state;
  }
}

/**
 * Controlador de ciclo de vida del reproductor de video sincronizado (SyncedVideoPlayer).
 * Garantiza la liberación inmediata de memoria y parada de reproducción en desmontaje.
 */
export interface VideoElementLike {
  src: string;
  currentTime: number;
  pause: () => void;
  removeAttribute: (attr: string) => void;
  load: () => void;
}

export function cleanupVideoPlayer(videoElement: VideoElementLike | null): void {
  if (!videoElement) return;

  try {
    videoElement.pause();
    videoElement.src = '';
    videoElement.removeAttribute('src');
    videoElement.load();
  } catch {
    // Protección ante navegadores sin soporte completo de unload
  }
}

export function seekVideoToStep(
  videoElement: VideoElementLike | null,
  capturedAtStepMs: number
): void {
  if (!videoElement) return;

  try {
    const seconds = Math.max(0, capturedAtStepMs / 1000);
    videoElement.currentTime = seconds;
  } catch {
    // Continuar
  }
}
