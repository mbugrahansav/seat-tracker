import { Cinsiyet, KoltukTipi } from "../constants/enum";

export class KullaniciBilgi {
  public cinsiyet: Cinsiyet;
  public koltukOncelik: KoltukTipi;

  constructor(obj: { cinsiyet: Cinsiyet; koltukOncelik: KoltukTipi }) {
    this.cinsiyet = obj.cinsiyet;
    this.koltukOncelik = obj.koltukOncelik;
  }
}