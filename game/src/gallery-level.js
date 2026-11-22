// The gallery itself: three rooms on one table, the walls, the solid cover that
// stops a gaze, the glass that does not, and where everything starts.
// Coordinates are canvas pixels on a fixed 1280x720 stage; the playfield is
// x 40..1000, y 126..654 and the right-hand panel starts at x 1020.
export const STAGE_WIDTH = 1280;
export const STAGE_HEIGHT = 720;
export const FIELD = { x: 40, y: 126, width: 960, height: 528 };
export const PRISM_VALUE = 600;
export const TOOL_BUDGET = 100;

export function createThreeRoomGallery() {
  const wall = 12;
  const fx = FIELD.x;
  const fy = FIELD.y;
  const fw = FIELD.width;
  const fh = FIELD.height;
  // Outer shell plus the two room dividers. Each divider leaves an upper and a
  // lower opening, so there are always two ways between any two rooms.
  const walls = [
    { x: fx, y: fy, width: fw, height: wall },
    { x: fx, y: fy + fh - wall, width: fw, height: wall },
    { x: fx, y: fy, width: wall, height: fh },
    { x: fx + fw - wall, y: fy, width: wall, height: fh },
    { x: 360, y: fy, width: wall, height: 84 },
    { x: 360, y: 278, width: wall, height: 216 },
    { x: 360, y: 566, width: wall, height: 88 },
    { x: 680, y: fy, width: wall, height: 84 },
    { x: 680, y: 278, width: wall, height: 216 },
    { x: 680, y: 566, width: wall, height: 88 },
  ];
  // Solid cover: blocks movement and blocks sight. A thief behind one is safe.
  const covers = [
    { x: 205, y: 360, width: 95, height: 55, label: 'SOLID COVER' },
    { x: 455, y: 255, width: 90, height: 50, label: 'SOLID COVER' },
    { x: 570, y: 510, width: 90, height: 50, label: 'SOLID COVER' },
    { x: 815, y: 440, width: 110, height: 55, label: 'SOLID COVER' },
  ];
  // Glass: blocks movement like a wall, but a gaze passes straight through it.
  // The trap of the hall: it looks like cover and it is not.
  const glass = [
    { x: 516, y: 356, width: 8, height: 68, label: 'GLASS DOES NOT HIDE YOU' },
    { x: 760, y: 300, width: 100, height: 8, label: 'GLASS DOES NOT HIDE YOU' },
  ];
  return {
    field: FIELD,
    walls,
    covers,
    glass,
    rooms: [
      { name: 'SERVICE DOCK', x: 52, y: 126, width: 308, height: 528, labelX: 200, labelY: 168, tint: '#101a20' },
      { name: 'GLASS HALL', x: 372, y: 126, width: 308, height: 528, tint: '#121420' },
      { name: 'PRISM VAULT', x: 692, y: 126, width: 308, height: 528, labelX: 838, labelY: 168, tint: '#1a1410' },
    ],
    spawn: { x: 95, y: 590 },
    exit: { x: 95, y: 590, radius: 46 },
    prism: { x: 915, y: 250, radius: 26 },
    guards: [
      { id: 'GUARD 01', waypoints: [[160, 230], [290, 340], [170, 485]], speed: 55, pause: 1.4 },
      { id: 'GUARD 02', waypoints: [[425, 330], [595, 330], [585, 475], [435, 475]], speed: 55, pause: 1.4 },
      { id: 'GUARD 03', waypoints: [[750, 230], [875, 370], [760, 520]], speed: 55, pause: 1.4 },
    ],
    cameras: [
      { id: 'CCTV 01', x: 650, y: 150, base: 1.75, amp: 0.95, period: 6, phase: 0 },
      { id: 'CCTV 02', x: 970, y: 150, base: 1.9, amp: 0.8, period: 5, phase: 2.1 },
    ],
  };
}
