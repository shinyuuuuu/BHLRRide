//change later to laravel backend (booking table ni siya)
//makeshift booking records !! for demo purposes nako during testing 
// status (enum): 'Pending' | 'Approved' | 'Completed' | 'Cancelled'

export const bookings = [
      { id: 'BK-1042', vehicleId: 1, start: '2026-10-16', end: '2026-10-19', status: 'Approved' },
  { id: 'BK-1038', vehicleId: 5, start: '2026-10-20', end: '2026-10-22', status: 'Pending' },
  { id: 'BK-0987', vehicleId: 7, start: '2026-09-02', end: '2026-09-04', status: 'Completed', reviewed: false },
  { id: 'BK-0951', vehicleId: 3, start: '2026-08-12', end: '2026-08-15', status: 'Completed', reviewed: true },
  { id: 'BK-0902', vehicleId: 6, start: '2026-07-01', end: '2026-07-02', status: 'Cancelled' },
]
