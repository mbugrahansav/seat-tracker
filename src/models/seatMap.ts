export class SeatMap {
  seatMapTemplate: {
    car: {
      name: string;
    };
    description: string;
  };

  trainCarId: number;

  allocationSeats: {
    seatNumber: string;
  }[];

  seatPrices: {
    seatNumber: string;
  }[];

  availableSeatCount: number;

  constructor(data: {
    seatMapTemplate: {
      car: { name: string };
      description: string;
    };
    trainCarId: number;
    allocationSeats: { seatNumber: string }[];
    seatPrices: { seatNumber: string }[];
    availableSeatCount: number;
  }) {
    this.seatMapTemplate = data.seatMapTemplate;
    this.trainCarId = data.trainCarId;
    this.allocationSeats = data.allocationSeats;
    this.seatPrices = data.seatPrices;
    this.availableSeatCount = data.availableSeatCount;
  }
}
