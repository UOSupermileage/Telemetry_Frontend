export const navigationPages = [
  { id: 'dashboard', label: 'Dashboard', icon: '\u25A6' },
  { id: 'runs', label: 'Runs', icon: '\u21BB' },
  { id: 'analysis', label: 'Analysis', icon: '\u25CE' },
]

export const telemetry = [
  { run_id: 3, tick: 0, throttle: 12, speed: 0, current: 4.2, voltage: 48.1 },
  { run_id: 3, tick: 1, throttle: 28, speed: 12, current: 9.8, voltage: 47.8 },
  { run_id: 3, tick: 2, throttle: 42, speed: 24, current: 15.3, voltage: 47.4 },
  { run_id: 3, tick: 3, throttle: 38, speed: 31, current: 13.7, voltage: 47.1 },
  { run_id: 3, tick: 4, throttle: 55, speed: 42, current: 20.2, voltage: 46.8 },
  { run_id: 3, tick: 5, throttle: 68, speed: 53, current: 25.4, voltage: 46.2 },
  { run_id: 3, tick: 6, throttle: 61, speed: 59, current: 22.8, voltage: 46.0 },
  { run_id: 3, tick: 7, throttle: 78, speed: 68, current: 29.5, voltage: 45.6 },
  { run_id: 3, tick: 8, throttle: 72, speed: 74, current: 27.1, voltage: 45.4 },
  { run_id: 3, tick: 9, throttle: 88, speed: 82, current: 33.8, voltage: 45.0 },
  { run_id: 3, tick: 10, throttle: 76, speed: 86, current: 28.7, voltage: 45.2 },
  { run_id: 3, tick: 11, throttle: 64, speed: 84, current: 24.1, voltage: 45.8 },
  { run_id: 3, tick: 12, throttle: 82, speed: 91, current: 30.6, voltage: 45.3 },
  { run_id: 3, tick: 13, throttle: 58, speed: 88, current: 21.9, voltage: 46.1 },
  { run_id: 3, tick: 14, throttle: 35, speed: 79, current: 13.2, voltage: 46.9 },
]

export const mockRuns = [
  { run_id: 1, car_id: 2, location_id: 1, driver_id: 3, started_at: '2026-09-20T14:00:00', ended_at: '2026-09-20T14:15:00', notes: 'First test run', date_created: '2026-09-20T15:00:00' },
  { run_id: 2, car_id: 1, location_id: 2, driver_id: 4, started_at: '2026-09-21T10:30:00', ended_at: '2026-09-21T10:48:00', notes: 'Testing new setup', date_created: '2026-09-21T11:00:00' },
  { run_id: 3, car_id: 2, location_id: 1, driver_id: 3, started_at: '2026-09-22T13:00:00', ended_at: '2026-09-22T13:22:00', notes: '', date_created: '2026-09-22T14:00:00' },
]

export const mockCars = [
  { id: 1, name: 'Car 1' }, { id: 2, name: 'Car 2' }, { id: 3, name: 'Car 3' },
]

export const mockDrivers = [
  { id: 1, name: 'John Smith' }, { id: 2, name: 'Jane Doe' }, { id: 3, name: 'Alex Johnson' }, { id: 4, name: 'Taylor Lee' },
]

export const mockLocations = [
  { id: 1, name: 'Test Track' }, { id: 2, name: 'Ottawa Circuit' }, { id: 3, name: 'Main Campus' },
]
