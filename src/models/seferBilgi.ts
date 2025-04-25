export class SeferBilgi {
  public kalkisYeri: string;
  public varisYeri: string;
  public gidisTarihi: string;
  public seferOncelik: number;

  constructor(obj: { kalkisYeri: string, varisYeri: string, gidisTarihi: string, seferOncelik: number }) {
    this.kalkisYeri = obj.kalkisYeri;
    this.varisYeri = obj.varisYeri;
    this.gidisTarihi = obj.gidisTarihi;
    this.seferOncelik = obj.seferOncelik;
  }
}