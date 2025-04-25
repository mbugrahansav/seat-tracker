import { KullaniciBilgi } from '../models/kullaniciBilgi';
import { Sefer } from '../models/seferListe';
import { SeferBilgi } from '../models/seferBilgi';
import { SeferListe } from '../models/seferListe';
import { parseKoltukSayisi } from '../utils/parseKoltukSayisi';
import { reserveSeat } from './puppeteerService';

export async function karsilastir(
  seferBilgi: SeferBilgi,
  guncelSeferListe: SeferListe,
  kullaniciBilgi: KullaniciBilgi,
  hedefSeferListe: SeferListe
) {
  for (const guncelSefer of guncelSeferListe.seferler) {
    const kontrolEdilenSefer = hedefSeferListe.seferler.find(
      hedefSefer => hedefSefer.kalkisSaati === guncelSefer.kalkisSaati
    );

    if (!kontrolEdilenSefer) {
      console.log('Hedef sefer bulunamadı', guncelSefer);
      return;
    }

    const businessChanged = parseKoltukSayisi(guncelSefer.business) > parseKoltukSayisi(kontrolEdilenSefer.business);
    const ekonomiChanged = parseKoltukSayisi(guncelSefer.ekonomi) > parseKoltukSayisi(kontrolEdilenSefer.ekonomi);

    if (businessChanged || ekonomiChanged) {
      console.log('Değişiklik bulundu:');
      console.log('Kalkış:', guncelSefer.kalkisSaati, 'Varış:', guncelSefer.varisSaati);
      if (businessChanged) {
        console.log('Business koltuk durumu değişti:', kontrolEdilenSefer.business, '->', guncelSefer.business);
      }
      if (ekonomiChanged) {
        console.log('Ekonomi koltuk durumu değişti:', kontrolEdilenSefer.ekonomi, '->', guncelSefer.ekonomi);
      }
      await reserveSeat(seferBilgi, guncelSefer, kullaniciBilgi);
      break;
    }
  };
}
