import { describe, expect, it, vi } from 'vitest';

import {
  cleanupVideoPlayer,
  INITIAL_UI_STATE,
  seekVideoToStep,
  uiReducer,
  type UIState,
  type VideoElementLike,
} from '../ui/ui-state.js';

describe('Máquina de Estados de UI y Controlador de Video (QAP v3.0 Reglas 6, 7 y 8)', () => {
  it('NAVIGATE_TO_VIEW resetea atómicamente drawers, modales y selección en una sola mutación (Checklist Gate)', () => {
    // Estado inicial "sucio" con drawer abierto, modal abierto y entidad seleccionada
    const dirtyState: UIState = {
      activeView: 'architecture',
      selectedEntity: { type: 'capability', id: 'auth.login.submit' },
      activeDrawer: 'inspector',
      modal: 'confirm-delete',
    };

    // Navegar a otra vista
    const nextState = uiReducer(dirtyState, {
      type: 'NAVIGATE_TO_VIEW',
      view: 'telemetry',
    });

    // Validar reseteo atómico
    expect(nextState.activeView).toBe('telemetry');
    expect(nextState.selectedEntity).toBeNull();
    expect(nextState.activeDrawer).toBeNull();
    expect(nextState.modal).toBeNull();
  });

  it('permite abrir drawers y modales pasando por el reducer sin usar useState local (Regla 6)', () => {
    let state = INITIAL_UI_STATE;

    // Seleccionar entidad con openInspector
    state = uiReducer(state, {
      type: 'SELECT_ENTITY',
      entity: { type: 'capability', id: 'checkout.pay' },
      openInspector: true,
    });
    expect(state.selectedEntity?.id).toBe('checkout.pay');
    expect(state.activeDrawer).toBe('inspector');

    // Cerrar drawer
    state = uiReducer(state, { type: 'CLOSE_DRAWER' });
    expect(state.activeDrawer).toBeNull();
    expect(state.selectedEntity?.id).toBe('checkout.pay');

    // Abrir modal de configuración
    state = uiReducer(state, { type: 'OPEN_MODAL', modal: 'settings' });
    expect(state.modal).toBe('settings');

    // Cerrar modal
    state = uiReducer(state, { type: 'CLOSE_MODAL' });
    expect(state.modal).toBeNull();
  });

  describe('Controlador de Video Sincronizado (SyncedVideoPlayer) (Checklist Gate)', () => {
    it('el reproductor de video se pausa y libera su src al desmontarse (Checklist Gate)', () => {
      const mockVideo: VideoElementLike = {
        src: 'http://localhost:9280/artifacts/run-123/artifacts/trace.mp4',
        currentTime: 4.5,
        pause: vi.fn(),
        removeAttribute: vi.fn(),
        load: vi.fn(),
      };

      cleanupVideoPlayer(mockVideo);

      expect(mockVideo.pause).toHaveBeenCalledTimes(1);
      expect(mockVideo.src).toBe('');
      expect(mockVideo.removeAttribute).toHaveBeenCalledWith('src');
      expect(mockVideo.load).toHaveBeenCalledTimes(1);
    });

    it('seekVideoToStep salta automáticamente al milisegundo exacto del fallo (capturedAtStepMs)', () => {
      const mockVideo: VideoElementLike = {
        src: 'http://localhost:9280/artifacts/run-123/artifacts/trace.mp4',
        currentTime: 0,
        pause: vi.fn(),
        removeAttribute: vi.fn(),
        load: vi.fn(),
      };

      // 4500 ms -> 4.5 s
      seekVideoToStep(mockVideo, 4500);
      expect(mockVideo.currentTime).toBe(4.5);

      // Si es negativo o 0 -> 0 s
      seekVideoToStep(mockVideo, -100);
      expect(mockVideo.currentTime).toBe(0);
    });
  });
});
