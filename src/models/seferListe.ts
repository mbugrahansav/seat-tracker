export interface Sefer {
  kalkisSaati: string;
  varisSaati: string;
  business: string;
  ekonomi: string;
}

export class SeferListe {
  public seferler: Sefer[] = [];

  constructor(initialSeferler: Sefer[] = []) {
    this.seferler = [...initialSeferler];
  }
}