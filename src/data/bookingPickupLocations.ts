export interface BookingPickupLocation {
  id: string;
  name: string;
  address: string;
  mapUrl: string;
}

export const BOOKING_PICKUP_LOCATIONS: BookingPickupLocation[] = [
  { id: 'times-city', name: 'Times City', address: 'Khu Minh Khai, Hà Nội', mapUrl: 'https://maps.app.goo.gl/aytjYtSmkNVvDnJb9' },
  { id: 'ocean-park', name: 'Ocean Park', address: 'Khu Gia Lâm, Hà Nội', mapUrl: 'https://maps.app.goo.gl/G8UHdiVEqe7TFqxk9' },
  { id: 'manor', name: 'The Manor Central Park', address: 'Trục Nguyễn Xiển, Hà Nội', mapUrl: 'https://maps.app.goo.gl/Nr1DysckyzRMBVqE8' },
  { id: 'trung-lan', name: 'Cầu Giấy', address: 'Điểm hẹn Gara Ô tô Trung Lân, Hà Nội', mapUrl: 'https://maps.app.goo.gl/DHu1nP1h6Gwb3FjZ8' },
];
