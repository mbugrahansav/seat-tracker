import puppeteer from 'puppeteer';
import { Sefer } from '../models/seferListe';
import { SeferBilgi } from '../models/seferBilgi';
import { SeferListe } from '../models/seferListe';
import { KullaniciBilgi } from '../models/kullaniciBilgi';
import { SeatMap } from '../models/seatMap';
import { getBrowser } from './browserManager';

export async function seferleriGetir(seferBilgi: SeferBilgi): Promise<SeferListe> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.goto('https://ebilet.tcddtasimacilik.gov.tr/');

  await page.waitForSelector('#fromTrainInput', { visible: true });
  await page.click('#fromTrainInput');
  if (typeof seferBilgi.kalkisYeri !== 'string' || seferBilgi.kalkisYeri.trim() === '') {
    console.error('Geçersiz kalkış yeri:', seferBilgi.kalkisYeri);
  }
  await page.type('#fromTrainInput', seferBilgi.kalkisYeri);
  await page.waitForSelector('[id*="gidis"]', { visible: true });
  await page.click('[id*="gidis"]');

  await page.waitForSelector('#toTrainInput', { visible: true });
  await page.click('#toTrainInput');
  if (typeof seferBilgi.varisYeri !== 'string' || seferBilgi.varisYeri.trim() === '') {
    console.error('Geçersiz varış yeri:', seferBilgi.varisYeri);
  }
  await page.type('#toTrainInput', seferBilgi.varisYeri);
  await page.waitForSelector('[id*="donus"]', { visible: true });
  await page.click('[id*="donus"]');

  await page.click('.datePickerInput.departureDate');
  await page.click(`.calendar-table td[data-date*="${seferBilgi.gidisTarihi}"]`);
  await page.click('#searchSeferButton');

  try {
    await page.waitForSelector('.accordion.seferAccordion', { visible: true });
    await page.waitForSelector('.card', { visible: true });
  } catch (error) {
    console.log('Seferler yüklenemedi veya bulunamadı:', error);
  }

  const rawSeferler: Sefer[] = await page.evaluate(() => {
    const kartlar = document.querySelectorAll('.card');
    const liste: Sefer[] = [];

    kartlar.forEach(kart => {
      const seferKalkis = kart.querySelector('time[title^="Gidiş"]')?.textContent?.trim() || '';
      const seferVaris = kart.querySelector('time[title^="Varış"]')?.textContent?.trim() || '';

      const bosKoltukBusinessEl = kart.querySelector('[id*="vagonType-1-0"] .emptySeat');
      const bosKoltukEkonomiEl = kart.querySelector('[id*="vagonType-2-0"] .emptySeat');

      const bosKoltukSayisiBusiness = bosKoltukBusinessEl ? bosKoltukBusinessEl.textContent?.trim() || 'DOLU' : 'DOLU';
      const bosKoltukSayisiEkonomi = bosKoltukEkonomiEl ? bosKoltukEkonomiEl.textContent?.trim() || 'DOLU' : 'DOLU';

      if (seferKalkis && seferVaris) {
        liste.push({
          kalkisSaati: seferKalkis,
          varisSaati: seferVaris,
          business: bosKoltukSayisiBusiness,
          ekonomi: bosKoltukSayisiEkonomi
        });
      }
    });
    return liste;
  });

  await browser.close();
  const seferler = new SeferListe();
  seferler.seferler = rawSeferler;
  return seferler;
}


export async function reserveSeat(seferBilgi: SeferBilgi, guncelSefer: Sefer, kullaniciBilgi: KullaniciBilgi) {
  const browser = await getBrowser({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://ebilet.tcddtasimacilik.gov.tr/');

  await page.waitForSelector('#fromTrainInput', { visible: true });
  await page.click('#fromTrainInput');
  if (typeof seferBilgi.kalkisYeri !== 'string' || seferBilgi.kalkisYeri.trim() === '') {
    console.error('Geçersiz kalkış yeri:', seferBilgi.kalkisYeri);
  }
  await page.type('#fromTrainInput', seferBilgi.kalkisYeri);
  await page.waitForSelector('[id*="gidis"]', { visible: true });
  await page.click('[id*="gidis"]');

  await page.waitForSelector('#toTrainInput', { visible: true });
  await page.click('#toTrainInput');
  if (typeof seferBilgi.varisYeri !== 'string' || seferBilgi.varisYeri.trim() === '') {
    console.error('Geçersiz varış yeri:', seferBilgi.varisYeri);
  }
  await page.type('#toTrainInput', seferBilgi.varisYeri);
  await page.waitForSelector('[id*="donus"]', { visible: true });
  await page.click('[id*="donus"]');

  await page.click('.datePickerInput.departureDate');
  await page.click(`.calendar-table td[data-date*="${seferBilgi.gidisTarihi}"]`);
  await page.click('#searchSeferButton');

  await page.waitForSelector('.accordion.seferAccordion', { visible: true });

  const kalkisSaati = guncelSefer.kalkisSaati;
  let seferContainer;

  try {
    const timeElement = await page.$(`time[datetime="${kalkisSaati}"]`);
    if (!timeElement) throw new Error("Time elementi bulunamadı");

    seferContainer = await timeElement.evaluateHandle(el => el.closest('.card'));

    await timeElement.click();
    console.log(`${kalkisSaati} için tıklama gerçekleştirildi.`);
  } catch (error) {
    console.error(`${kalkisSaati} saatindeki sefer bulunamadı ya da tıklanamadı`, error);
  }

  const businessBos = guncelSefer.business !== "DOLU";
  const ekonomiBos = guncelSefer.ekonomi !== "DOLU";

  let secilecekTip = "";

  if (businessBos && ekonomiBos) {
    secilecekTip = kullaniciBilgi.koltukOncelik;
  } else if (businessBos) {
    secilecekTip = "BUSİNESS";
  } else if (ekonomiBos) {
    secilecekTip = "EKONOMİ";
  }

  const seferElement = seferContainer?.asElement();
  if (secilecekTip && seferElement) {
    try {
      if (secilecekTip && seferElement !== null) {
        const buttons = await seferElement.$$(`.btnTicketType`);
        console.log(buttons.length, ' adet buton bulundu.');
        for (const button of buttons) {
          const text = await button.evaluate(el => el.textContent?.toUpperCase());
          console.log('Buton:', text);
          if (text?.includes(secilecekTip)) {
            if (await button.isVisible()) {
              await button.click();
              console.log(`${secilecekTip} tipi koltuk seçildi.`);
              break;
            } else {
              console.log(`${secilecekTip} tipi buton henüz tıklanabilir değil.`);
            }
          }
        }
      }
      const btn = await seferElement.$('.btnResult .btn');
      if (btn) await btn.click();
      await page.waitForSelector('.seferInformationArea', { visible: true });
      const devamButonu = await page.$('.btn.btnContinue');

      const expectedUrlPart = "seat-maps/load-by-train-id?environment=dev&userId=1";
      const responsePromise = page.waitForResponse(response =>
        response.url().includes(expectedUrlPart) && response.status() === 200
      );
      if (devamButonu) {
        await devamButonu.click();
      }
      const response = await responsePromise;
      const loadByTrainId = await response.json();
      const seatMaps: SeatMap[] = loadByTrainId.seatMaps;
      let secilenVagon: string | null = null;
      let secilenKoltuk: string | null = null;
      let secilenTrainCarId: number | null = null;

      for (const seat of seatMaps) {
        const template = seat.seatMapTemplate;
        const carName = template?.car?.name || 'Bilinmiyor';
        const vagonAciklama = template?.description || 'Açıklama yok';
        const vagonTrainCarId = seat.trainCarId;

        if (carName.toLocaleLowerCase('tr-TR').includes(secilecekTip.toLocaleLowerCase('tr-TR'))) {
          const bulunduguVagon = vagonAciklama;
          const vagonKoltuklar = seat.seatPrices.map((k: { seatNumber: string }) => k.seatNumber);
          const vagonDoluKoltuklar = seat.allocationSeats.map((k: { seatNumber: string }) => k.seatNumber);
          const vagonBosKoltuklar = vagonKoltuklar.filter(
            koltuk => !vagonDoluKoltuklar.includes(koltuk) && !koltuk.endsWith('H')
          );

          if (vagonBosKoltuklar.length > 0) {
            secilenVagon = bulunduguVagon;
            secilenKoltuk = vagonBosKoltuklar[0];
            secilenTrainCarId = vagonTrainCarId;
            console.log(`Bulunduğu Vagon: ${secilenVagon}, Bulunan koltuk numarası: ${secilenKoltuk}, Vagon ID: ${secilenTrainCarId}`);
            break;
          }
        }
      }

      if (!secilenVagon) throw new Error('secilenVagon null olamaz');
      if (!secilenKoltuk) throw new Error('secilenVagon null olamaz');

      const vagons = await page.$$('button.btnWagon');

      for (const vagon of vagons) {
        const spanText = await vagon.$eval('span', el => el.textContent?.trim());
        const normalizedSpan = spanText?.trim().toLowerCase();
        console.log(normalizedSpan);
        const normalizedSecilenVagon = secilenVagon.trim().toLowerCase();
        console.log(normalizedSecilenVagon);
        if (normalizedSecilenVagon.includes(normalizedSpan!)) {
          await vagon.click();
          console.log(`${spanText} ile ${secilenVagon} eşleşti ve tıklandı.`);
          break;
        }
      }

      const seats = await page.$$('.seatNumber')

      for (const seat of seats) {
        const normalizedSeat = await seat.evaluate(el => el.textContent?.trim().toLowerCase());;
        const lowerSecilenKoltuk = secilenKoltuk.toLowerCase();
        if (normalizedSeat === lowerSecilenKoltuk) {
          await seat.click();
          console.log(`${normalizedSeat} ile ${lowerSecilenKoltuk} eşleşti ve tıklandı.`);
          break
        }
      }

      await page.waitForSelector('button.popoverBtn', { timeout: 5000 });
      const seatGenderButtons = await page.$$('button.popoverBtn')

      let userGender = kullaniciBilgi.cinsiyet === "M" ? "man" : "woman";
      for (const seatGenderButton of seatGenderButtons) {

        const img = await seatGenderButton.$('img');
        if (!img) {
          console.log("img bulunamadı");
          continue;
        }
        const alt = await img.evaluate(el => el.getAttribute('alt'));

        if (alt?.includes(userGender)) {
          await seatGenderButton.evaluate(el => el.click());
          console.log("Tıklandı");
          break;
        }
      }










    } catch (error) {
      console.error(`Hata oluştu:`, error);
    }
  } else {
    console.log("Uygun koltuk tipi bulunamadı veya seferContainer bulunamadı.");
  }
}