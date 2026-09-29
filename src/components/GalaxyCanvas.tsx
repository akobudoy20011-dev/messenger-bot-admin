export type GalaxyNodeId =
  | 'overview'
  | 'messenger'
  | 'users'
  | 'economy'
  | 'rpg'
  | 'games'
  | 'moderation'
  | 'music'
  | 'analytics'
  | 'logs'
  | 'health'
  | 'settings';

export interface GalaxyCanvasProps {
  focusId: GalaxyNodeId;
  onSelect: (id: GalaxyNodeId) => void;
}

/**
 * Legacy compatibility shim.
 *
 * The dashboard no longer renders the interactive galaxy. App.tsx still imports
 * this component/type while the navigation/data surfaces are being kept stable.
 */
export default function GalaxyCanvas(_props: GalaxyCanvasProps) {
  return null;
}
