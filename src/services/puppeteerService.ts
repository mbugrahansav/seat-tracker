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
          console.log('Bunlar:', text);
          if (text?.includes(secilecekTip)) {
            await button.click();
            console.log(`${secilecekTip} tipi koltuk seçildi.`);
            break;
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

      for (const seat of seatMaps) {
        const template = seat.seatMapTemplate;
        const carName = template?.car?.name || 'Bilinmiyor';
        const vagonAciklama = template?.description || 'Açıklama yok';
        const vagonTrainCarId = seat.trainCarId;
        const bosKoltukSayisi = seat.availableSeatCount ?? 0;

        if (carName.toLowerCase().includes(secilecekTip.toLowerCase())) { // bu satırda I İ muhabbeti patlatabilir dikkat et
          const vagonKoltuklar = seat.seatPrices.map((k: { seatNumber: string }) => k.seatNumber);
          const vagonDoluKoltuklar = seat.allocationSeats.map((k: { seatNumber: string }) => k.seatNumber);
          const vagonBosKoltuklar = vagonKoltuklar.filter(
            koltuk => !vagonDoluKoltuklar.includes(koltuk) && !koltuk.endsWith('H')
          );

          console.log(`${vagonAciklama}, Tip: ${carName}, TrainCarId: ${vagonTrainCarId}, Boş Koltuk Sayısı: ${bosKoltukSayisi}, Boş Koltuklar: ${vagonBosKoltuklar.join(', ')}`);

          const uygunKoltuk = vagonBosKoltuklar[0];

          if (uygunKoltuk) {
            const payload = {
              fareFamilyId: 0,
              fromStationId: 93, // Senin API’nden geliyor
              gender: kullaniciBilgi.cinsiyet,
              passengerTypeId: 0,
              seatNumber: uygunKoltuk,
              toStationId: 98, // Senin API’nden geliyor
              totalPassengerCount: 1,
              trainCarId: vagonTrainCarId
            };

            console.log('Payload:', payload);
            // Burada fetch veya başka bir yöntemle payload'ı gönderebilirsin.
            // await fetch('https://…/select-seat', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' }});
          }
        }
      }
















      /* for (const seat of seatMaps) {
        const template = seat.seatMapTemplate;
        const carName = template?.car?.name || 'Bilinmiyor';
        const vagonAciklama = template?.description || 'Açıklama yok';
        const vagonTrainCarId = seat.trainCarId;
        const bosKoltukSayisi = seat.availableSeatCount ?? 0;
        const vagonKoltuklar = seat.seatPrices.map((k: { seatNumber: string }) => k.seatNumber);
        const vagonDoluKoltuklar = seat.allocationSeats.map((k: { seatNumber: string }) => k.seatNumber);
        const vagonBosKoltuklar = vagonKoltuklar.filter(
          koltuk => !vagonDoluKoltuklar.includes(koltuk) && !koltuk.endsWith('H')
        );
        console.log(`${vagonAciklama}, Tip: ${carName}, TrainCarId: ${vagonTrainCarId}, Boş Koltuk Sayısı: ${bosKoltukSayisi}, Boş Koltuklar: ${vagonBosKoltuklar.join(', ')}`);

        const uygunKoltuk = vagonBosKoltuklar[0];
        const payload = {
          fareFamilyId: 0,
          fromStationId: 93, // Senin API’nden geliyor
          gender: kullaniciBilgi.cinsiyet,
          passengerTypeId: 0,
          seatNumber: uygunKoltuk,
          toStationId: 98, // Senin API’nden geliyor
          totalPassengerCount: 1,
          trainCarId: vagonTrainCarId
        };
      } */
    } catch (error) {
      console.error(`Hata oluştu:`, error);
    }
  } else {
    console.log("Uygun koltuk tipi bulunamadı veya seferContainer bulunamadı.");
  }












  /* await page.waitForSelector('#departureTabArea', { visible: true });
  const parentDivs = await page.$$('.wagonMap');
  if (secilecekTip) {
    try {
      for (const div of parentDivs) {
        try {
          const bosKoltuk = await div.$eval('.textEmptySeat > span', el => el.textContent?.trim());
          if (bosKoltuk !== '0') {
            const vagonTipi = await div.$eval('.textWagonType', el => el.textContent?.trim());
            if (vagonTipi?.toUpperCase().includes(secilecekTip.toUpperCase())) {
              const btnWagon = await div.$('.btnWagon');
              if (btnWagon) {
                console.log(`${secilecekTip} tipi vagon seçildi. ${bosKoltuk} adet boş koltuk mevcut`);
                await btnWagon.click();
                break;
              } else {
                console.log("'.btnWagon' bulunamadı.");
              }
            }
          }
        } catch (error) { }
      }
    } catch (error) {
      console.error(`Hata oluştu:`, error);
    }
  } */

}