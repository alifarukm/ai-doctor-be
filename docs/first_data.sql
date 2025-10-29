-- =====================================================
-- MEDICAL DATA INSERTION SCRIPT
-- Üst Solunum Yolu Enfeksiyonları Veritabanı
-- =====================================================

-- 1. HASTALIK KATEGORİSİ
INSERT INTO disease_categories (id, name, description) VALUES 
(1, 'ÜST SOLUNUM YOLU ENFEKSİYONLARI', 'Burun, boğaz, gırtlak ve kulakları etkileyen enfeksiyonlar');

-- 2. HASTALIKLAR
INSERT INTO diseases (id, name, description, category_id) VALUES 
(1, 'Soğuk algınlığı (viral rinit)', 'Şeffaf burun akıntısı, hapşırma, hafif boğaz yanması ile seyreden viral enfeksiyon', 1),
(2, 'Akut bakteriyel tonsillit', 'Ani başlangıç, ateş, şiddetli boğaz ağrısı, yutma güçlüğü, bademciklerde hiperemi ile seyreden bakteriyel enfeksiyon', 1),
(3, 'Viral farenjit', 'Boğaz ağrısı, hafif ateş, öksürük, burun akıntısı ile seyreden viral boğaz iltihabı', 1),
(4, 'Larenjit', 'Ses kısıklığı, kuru öksürük ve konuşmakla artan ağrı ile karakterize gırtlak iltihabı', 1),
(5, 'Bakteriyel sinüzit', 'Burun tıkanıklığı, yüzde ağrı/basınç hissi, purulan burun akıntısı, baş ağrısı ile seyreden sinüs iltihabı', 1),
(6, 'Akut otitis media', 'Kulak ağrısı, ateş, işitmede azalma, timpan zarda hiperemi ve bombeleşme ile seyreden orta kulak iltihabı', 1);

-- 3. SEMPTOMLAR
INSERT INTO symptoms (id, name, description, severity) VALUES 
-- Boğaz semptomları
(1, 'Boğaz ağrısı', 'Boğazda ağrı, yanma veya rahatsızlık hissi', NULL),
(2, 'Şiddetli boğaz ağrısı', 'Yutmayı zorlaştıran yoğun boğaz ağrısı', 'şiddetli'),
(3, 'Yutma güçlüğü', 'Yutkunurken ağrı veya zorluk', 'orta'),
(4, 'Ses kısıklığı', 'Sesin kalitesinde değişiklik, kısıklık', 'orta'),

-- Burun semptomları
(5, 'Burun akıntısı', 'Burun akıntısı (renk belirtilmemiş)', NULL),
(6, 'Şeffaf burun akıntısı', 'Berrak, şeffaf burun akıntısı (viral)', 'hafif'),
(7, 'Purulan burun akıntısı', 'Sarı-yeşil renkli burun akıntısı (bakteriyel)', 'orta'),
(8, 'Burun tıkanıklığı', 'Burun tıkanması, nefes almada zorluk', 'orta'),
(9, 'Hapşırma', 'Sık hapşırma', 'hafif'),
(10, 'Geniz akıntısı', 'Burundan boğaza akan akıntı', 'hafif'),

-- Öksürük
(11, 'Öksürük', 'Öksürük (tip belirtilmemiş)', NULL),
(12, 'Kuru öksürük', 'Balgamsız, gıdıklayıcı öksürük', 'hafif'),
(13, 'Hafif öksürük', 'Hafif şiddette öksürük', 'hafif'),

-- Ateş ve genel semptomlar
(14, 'Ateş', 'Yüksek vücut ısısı', 'orta'),
(15, 'Ani başlangıç', 'Semptomların ani ve hızlı başlaması', NULL),
(16, 'Hafif ateş', 'Hafif yükseklik gösteren vücut ısısı', 'hafif'),
(17, 'Subfebril ateş', 'Çok hafif ateş, ateş yok denecek kadar az', 'hafif'),
(18, 'Halsizlik', 'Genel güçsüzlük, yorgunluk', 'hafif'),

-- Kulak semptomları
(19, 'Kulak ağrısı', 'Kulakta ağrı', 'orta'),
(20, 'İşitmede azalma', 'Duyma zorluğu', 'orta'),

-- Lenf ve bademcik bulguları
(21, 'Bademciklerde hiperemi', 'Bademciklerin kırmızı ve şiş görünümü', 'orta'),
(22, 'Lenf nodları ağrılı ve şiş', 'Boyun lenf bezlerinin büyümesi ve hassasiyeti', 'orta'),

-- Diğer semptomlar
(23, 'Konjuktivit', 'Göz iltihabı, kızarıklık', 'hafif'),
(24, 'Yüzde ağrı/basınç', 'Yüz bölgesinde dolgunluk, basınç hissi', 'orta'),
(25, 'Baş öne eğilince artan baş ağrısı', 'Pozisyon değişikliği ile artan baş ağrısı', 'orta'),
(26, 'Koku almada azalma', 'Koku alma duyusunda azalma', 'hafif'),
(27, 'Konuşmakla ağrı artışı', 'Konuşurken boğaz ağrısının artması', 'orta'),
(28, 'Timpan zarda hiperemi ve bombeleşme', 'Kulak zarında kızarıklık ve dışa doğru şişme', 'orta'),
(29, 'Çocuklarda huzursuzluk', 'Pediatrik hastalarda irritabilite', 'orta'),
(30, 'Beslenme reddi', 'Çocukta yeme-içme istememe', 'orta');

-- 4. HASTALIK-SEMPTOM İLİŞKİLERİ

-- AKUT BAKTERİYEL TONSİLLİT (disease_id: 2)
INSERT INTO disease_symptoms (disease_id, symptom_id, is_primary, importance, description) VALUES 
(2, 15, 1, 10, 'Ani başlangıç karakteristiktir'),
(2, 14, 1, 10, 'Yüksek ateş'),
(2, 2, 1, 10, 'Şiddetli boğaz ağrısı'),
(2, 3, 1, 9, 'Yutma güçlüğü'),
(2, 21, 1, 9, 'Bademciklerde hiperemi görülür'),
(2, 22, 1, 8, 'Lenf nodları ağrılı ve şiş');

-- VİRAL FARENJİT (disease_id: 3)
INSERT INTO disease_symptoms (disease_id, symptom_id, is_primary, importance, description) VALUES 
(3, 1, 1, 8, 'Boğaz ağrısı mevcut'),
(3, 16, 1, 7, 'Hafif ateş'),
(3, 11, 1, 7, 'Öksürük var'),
(3, 5, 1, 7, 'Burun akıntısı'),
(3, 23, 0, 5, 'Konjuktivit varsa viral lehine'),
(3, 4, 0, 5, 'Ses kısıklığı varsa viral lehine'),
(3, 13, 0, 5, 'Hafif öksürük varsa viral lehine');

-- LARENJİT (disease_id: 4)
INSERT INTO disease_symptoms (disease_id, symptom_id, is_primary, importance, description) VALUES 
(4, 4, 1, 10, 'Ses kısıklığı en belirgin semptomdur'),
(4, 1, 1, 8, 'Boğaz ağrısı'),
(4, 12, 1, 8, 'Kuru öksürük'),
(4, 27, 1, 8, 'Konuşmakla ağrı artışı');

-- VİRAL RİNİT (SOĞUK ALGINLIĞI) (disease_id: 1)
INSERT INTO disease_symptoms (disease_id, symptom_id, is_primary, importance, description) VALUES 
(1, 6, 1, 10, 'Şeffaf burun akıntısı karakteristiktir'),
(1, 9, 1, 9, 'Hapşırma'),
(1, 1, 0, 6, 'Hafif boğaz yanması'),
(1, 18, 0, 6, 'Hafif halsizlik'),
(1, 17, 0, 5, 'Ateş yoktur veya subfebril');

-- BAKTERİYEL SİNÜZİT (disease_id: 5)
INSERT INTO disease_symptoms (disease_id, symptom_id, is_primary, importance, description) VALUES 
(5, 8, 1, 10, 'Burun tıkanıklığı'),
(5, 24, 1, 10, 'Yüzde ağrı/basınç hissi'),
(5, 25, 1, 9, 'Baş öne eğilince artan baş ağrısı'),
(5, 7, 1, 9, 'Purulan burun akıntısı'),
(5, 10, 1, 8, 'Geniz akıntısı'),
(5, 26, 0, 7, 'Koku almada azalma');

-- AKUT OTİTİS MEDİA (disease_id: 6)
INSERT INTO disease_symptoms (disease_id, symptom_id, is_primary, importance, description) VALUES 
(6, 19, 1, 10, 'Kulak ağrısı'),
(6, 14, 1, 9, 'Ateş'),
(6, 20, 1, 8, 'İşitmede azalma'),
(6, 28, 1, 9, 'Timpan zarda hiperemi ve bombeleşme'),
(6, 29, 0, 7, 'Çocuklarda huzursuzluk belirgin'),
(6, 30, 0, 7, 'Beslenme reddi');

-- 5. TANI KRİTERLERİ

-- AKUT BAKTERİYEL TONSİLLİT
INSERT INTO diagnosis_criterions (disease_id, criteria, type, priority) VALUES 
(2, 'Ani başlangıç, ateş, şiddetli boğaz ağrısı, yutma güçlüğü, bademciklerde hiperemi', 'positive', 1),
(2, 'Öksürük genelde yoktur', 'negative', 2),
(2, 'Lenf nodları ağrılı ve şiştir', 'positive', 3);

-- VİRAL FARENJİT
INSERT INTO diagnosis_criterions (disease_id, criteria, type, priority) VALUES 
(3, 'Boğaz ağrısı, hafif ateş, öksürük, burun akıntısı', 'positive', 1),
(3, 'Konjuktivit, ses kısıklığı, hafif öksürük varsa viral lehine', 'positive', 2);

-- LARENJİT
INSERT INTO diagnosis_criterions (disease_id, criteria, type, priority) VALUES 
(4, 'Ses kısıklığı en belirgin semptomdur', 'positive', 1),
(4, 'Boğaz ağrısı, kuru öksürük ve konuşmakla ağrı artışı', 'positive', 2);

-- VİRAL RİNİT
INSERT INTO diagnosis_criterions (disease_id, criteria, type, priority) VALUES 
(1, 'Şeffaf burun akıntısı, hapşırma, hafif boğaz yanması, hafif halsizlik', 'positive', 1),
(1, 'Ateş yoktur veya subfebrildir', 'negative', 2);

-- BAKTERİYEL SİNÜZİT
INSERT INTO diagnosis_criterions (disease_id, criteria, type, priority) VALUES 
(5, 'Burun tıkanıklığı, yüzde ağrı/basınç hissi, baş öne eğilince artan baş ağrısı, purulan burun akıntısı, geniz akıntısı', 'positive', 1),
(5, 'Yüzde dolgunluk ve koku almada azalma', 'positive', 2);

-- AKUT OTİTİS MEDİA
INSERT INTO diagnosis_criterions (disease_id, criteria, type, priority) VALUES 
(6, 'Boğaz ağrısı veya burun tıkanıklığından birkaç gün sonra gelişen kulak ağrısı, ateş, işitmede azalma', 'positive', 1),
(6, 'Timpan zarda hiperemi ve bombeleşme', 'positive', 2),
(6, 'Çocuklarda huzursuzluk ve beslenme reddi belirgin', 'positive', 3);

-- 6. İLAÇLAR (GENERIC NAMES)

INSERT INTO medications (id, generic_name, description, type, contraindications) VALUES 
-- Antibiyotikler
(1, 'Amoksisilin-Klavulanik asit', 'Beta-laktamaz inhibitörü ile kombine penisilin', 'antibiyotik', '28 günden küçük bebekler, Kreatinin <30 mL/dk'),
(2, 'Azitromisin', 'Makrolid antibiyotik', 'antibiyotik', 'Yaş <28 gün'),
(3, 'Klaritromisin', 'Makrolid antibiyotik', 'antibiyotik', NULL),
(4, 'Klindamisin', 'Linkozamid antibiyotik', 'antibiyotik', NULL),

-- Analjezik/Antipiretikler
(5, 'Parasetamol', 'Analjezik ve antipiretik', 'analjezik', NULL),
(6, 'İbuprofen', 'NSAİİ - analjezik ve antipiretik', 'analjezik', 'Yaş <6 ay, ağırlık <7 kg'),

-- Antihistaminikler
(7, 'Ketotifen', 'H1 antihistaminik', 'antihistaminik', NULL),
(8, 'Setirizin', 'H1 antihistaminik', 'antihistaminik', NULL),
(9, 'Desloratadin', 'H1 antihistaminik', 'antihistaminik', NULL),
(10, 'Bilastin', 'H1 antihistaminik', 'antihistaminik', 'Yaş <12'),

-- Dekonjestenlar
(11, 'Oksimetazolin', 'Topikal alfa-agonist dekonjestan', 'dekonjestan', 'Kullanım >5-7 gün'),
(12, 'Ksilometazolin', 'Topikal alfa-agonist dekonjestan', 'dekonjestan', 'Kullanım >5-7 gün'),
(13, 'Psödoefedrin', 'Oral dekonjestan', 'dekonjestan', 'Yaş <6, hipertansiyon'),
(14, 'İbuprofen+Psödoefedrin+Vitamin C', 'Kombine soğuk algınlığı ilacı', 'dekonjestan', 'Yaş <12'),

-- Antitüsifler
(15, 'Levodropropizin', 'Periferik antitüsif', 'antitüsif', NULL),
(16, 'Dextromethorphan', 'Santral antitüsif', 'antitüsif', 'Yaş <2'),

-- Nazal steroidler
(17, 'Beklometazon', 'Nazal kortikosteroid', 'nazal_steroid', NULL),

-- Diğer
(18, 'Serum fizyolojik', 'İzotonik tuzlu su', 'destek', NULL),
(19, 'Antiseptik boğaz spreyi', 'Lokal antiseptik', 'destek', NULL),
(20, 'Kulak damlası (analjezik)', 'Otalji için lokal analjezik', 'analjezik', NULL);

-- 7. MARKA İSİMLERİ

INSERT INTO medications_brand_names (medication_id, name) VALUES 
-- Amoksisilin-Klavulanik asit markaları
(1, 'KLAVUNAT'),
(1, 'AMOKLAVİN'),
(1, 'KLAMOKS'),
(1, 'AUGMENTİN'),

-- Azitromisin markaları
(2, 'AZİTRO'),
(2, 'AZELTİN'),

-- Klaritromisin markaları
(3, 'KLAMER'),
(3, 'MACROL'),

-- Klindamisin markaları
(4, 'KLİNDAN'),

-- Parasetamol markaları
(5, 'PAROL'),
(5, 'TYLOL'),
(5, 'CALPOL'),
(5, 'SETAPAR'),

-- İbuprofen markaları
(6, 'İBUFEN'),
(6, 'PEDİFEN'),
(6, 'DOLVEN'),
(6, 'İBUFORT'),
(6, 'İBUCOLD'),
(6, 'SUPRAFEN'),
(6, 'BRUFEN'),

-- Antihistaminik markaları
(7, 'ZADİTEN'),
(8, 'ZYRTEC'),
(8, 'CETRYN'),
(9, 'DELODAY'),
(10, 'BİLAXTEN'),
(10, 'AERIUS'),

-- Dekonjestan markaları
(11, 'İLİADİN'),
(11, 'NASOVİNE DUO'),
(12, 'OTRİVİNE'),
(13, 'SUDAFED'),
(14, 'COLDAWAY-C'),
(14, 'NUROFEN-COLD-FLU'),

-- Antitüsif markaları
(15, 'LEVOPRONT'),
(16, 'MUKORAL'),

-- Nazal steroid markaları
(17, 'NAZOSTER'),
(17, 'DALMAN'),
(17, 'BEKLOMİL'),

-- Boğaz spreyi markaları
(19, 'KLOROBEN'),
(19, 'ANDOREX'),
(19, 'MAJEZİK'),
(19, 'SEPTİX'),
(19, 'TANTUM DUO VERDE'),

-- Kulak damlası
(20, 'OTİPAX');

-- 8. TEDAVİ PROTOKOLLERİ

-- AKUT BAKTERİYEL TONSİLLİT TEDAVİLERİ
INSERT INTO medications_treatments (id, disease_id, type, name, description, priority, is_required, conditions) VALUES 
(1, 2, 'antibiyotik', 'Antibiyotik Tedavisi - Birinci Seçenek', 'Amoksisilin-Klavulanik asit tedavisi', 1, 1, NULL),
(2, 2, 'antibiyotik', 'Antibiyotik Tedavisi - Penisilin Alerjisi', 'Penisilin alerjisi olan hastalarda alternatif antibiyotik', 2, 0, 'Penisilin alerjisi varsa'),
(3, 2, 'semptomatik', 'Ağrı ve Ateş Kontrolü', 'Parasetamol veya ibuprofen ile semptomatik tedavi', 1, 1, NULL),
(4, 2, 'destekleyici', 'Destek Tedavi', 'Tuzlu su gargarası, bol sıvı, istirahat', 1, 1, NULL);

-- VİRAL FARENJİT TEDAVİLERİ
INSERT INTO medications_treatments (id, disease_id, type, name, description, priority, is_required, conditions) VALUES 
(5, 3, 'semptomatik', 'Ağrı ve Ateş Kontrolü', 'Parasetamol veya ibuprofen', 1, 1, NULL),
(6, 3, 'destekleyici', 'Boğaz Rahatlatıcı Önlemler', 'Ilık tuzlu su gargarası, ballı ılık içecekler, boğaz pastilleri', 1, 1, NULL),
(7, 3, 'destekleyici', 'Burun Tıkanıklığı Tedavisi', 'Serum fizyolojik ve kısa süreli dekonjestan', 2, 0, 'Burun tıkanıklığı / öksürük varsa');

-- LARENJİT TEDAVİLERİ
INSERT INTO medications_treatments (id, disease_id, type, name, description, priority, is_required, conditions) VALUES 
(8, 4, 'ses_istirahati', 'Ses İstirahati', 'En önemli tedavi, fısıltı bile yasak, 3-5 gün istirahat', 1, 1, NULL),
(9, 4, 'hidrasyon', 'Hidrasyon', 'Bol ılık sıvı, ortam havası nemli olmalı, buhar inhalasyonu', 1, 1, NULL),
(10, 4, 'semptomatik', 'Semptomatik Tedavi', 'Parasetamol veya ibuprofen', 2, 0, 'Ateş-boğaz ağrısı varsa'),
(11, 4, 'antitüsif', 'Antitüsif Tedavi', 'Kuru ve gıdıklayıcı öksürükte antitüsif', 2, 0, 'Kuru öksürük varsa'),
(12, 4, 'antibiyotik', 'Antibiyotik Tedavisi', 'Genellikle gerek yok, spesifik durumlarda', 3, 0, 'Şiddetli ağrı, ateş, balgam veya bakteriyel süperenfeksiyon varsa');

-- VİRAL RİNİT TEDAVİLERİ
INSERT INTO medications_treatments (id, disease_id, type, name, description, priority, is_required, conditions) VALUES 
(13, 1, 'destekleyici', 'Burun Tıkanıklığı Tedavisi', 'Serum fizyolojik ve topikal dekonjestanlar', 1, 1, NULL),
(14, 1, 'antihistaminik', 'Antihistaminik Tedavi', 'Burun akıntısı ve hapşırmaya yönelik', 1, 1, NULL),
(15, 1, 'semptomatik', 'Ağrı ve Ateş Kontrolü', 'Gerekirse parasetamol veya ibuprofen', 2, 0, 'Ağrı ve ateş varsa'),
(16, 1, 'destekleyici', 'Genel Destek', 'Bol sıvı alımı, oda nemini artırma, istirahat', 1, 1, NULL);

-- BAKTERİYEL SİNÜZİT TEDAVİLERİ
INSERT INTO medications_treatments (id, disease_id, type, name, description, priority, is_required, conditions) VALUES 
(17, 5, 'destekleyici', 'Semptomatik ve Destek Tedavisi', 'Serum fizyolojik, nemli hava, bol sıvı', 1, 1, NULL),
(18, 5, 'semptomatik', 'Analjezik-Antipiretik', 'Ağrı ve ateş kontrolü', 1, 1, NULL),
(19, 5, 'dekonjestan', 'Dekonjestan Tedavi', 'Topikal ve/veya oral dekonjestanlar', 1, 1, NULL),
(20, 5, 'antibiyotik', 'Antibiyotik Tedavisi', 'Bakteriyel sinüzit tedavisi', 1, 1, NULL),
(21, 5, 'nazal_steroid', 'Nazal Steroid', 'Özellikle alerjik komponent varsa', 2, 0, 'Alerjik komponent varsa');

-- AKUT OTİTİS MEDİA TEDAVİLERİ
INSERT INTO medications_treatments (id, disease_id, type, name, description, priority, is_required, conditions) VALUES 
(22, 6, 'semptomatik', 'Ateş Düşürücü ve Ağrı Kesici', 'Parasetamol veya ibuprofen', 1, 1, NULL),
(23, 6, 'destekleyici', 'Burun Tıkanıklığı Tedavisi', 'Serum fizyolojik + kısa süreli topikal dekonjestan', 1, 0, 'Burun tıkanıklığı varsa'),
(24, 6, 'destek', 'Bol Sıvı ve Nazal Aspirasyon', 'Genel destek önlemleri', 1, 1, NULL),
(25, 6, 'lokal_analjezik', 'Kulak Damlası', 'Analjezik etkili kulak damlası', 1, 1, NULL),
(26, 6, 'antibiyotik', 'Antibiyotik Tedavisi', 'Akut otitis media antibiyotik tedavisi', 1, 1, NULL);

-- 9. DOZAJ BİLGİLERİ

-- ==========================================
-- AKUT BAKTERİYEL TONSİLLİT DOZAJLARI
-- ==========================================

-- Treatment 1: Amoksisilin-Klavulanik asit (Birinci seçenek)
-- Pediatrik
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(1, 1, 'pediatric', 1, NULL, NULL, 40, '90 mg/kg/gün', 'günde 2 kez', '10 gün', NULL, NULL, NULL, '28 günden büyük bebeklerde, Kreatinin >30', 0, NULL);

-- Yetişkin
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(1, 1, 'adult', 216, NULL, NULL, NULL, '1000 mg', 'günde 2 kez', '10 gün', NULL, NULL, NULL, NULL, 0, NULL);

-- Treatment 2: Alternatif antibiyotikler (Penisilin alerjisi)
-- Azitromisin - Pediatrik
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(2, 2, 'pediatric', 1, NULL, NULL, NULL, '5-12 mg/kg/gün', 'tek doz', '5 gün', '500 mg/gün', NULL, NULL, 'Yaş >28 gün', 1, 'Penisilin alerjisi varsa');

-- Azitromisin - Yetişkin
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(2, 2, 'adult', 216, NULL, NULL, NULL, '500 mg', '1×/gün', '5 gün', NULL, NULL, NULL, NULL, 1, 'Penisilin alerjisi varsa');

-- Klaritromisin - Pediatrik
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(2, 3, 'pediatric', 0, NULL, NULL, NULL, '15 mg/kg', 'günde 2 kez', '10 gün', '1000 mg', NULL, NULL, NULL, 1, 'Penisilin alerjisi varsa');

-- Klaritromisin - Yetişkin
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(2, 3, 'adult', 216, NULL, NULL, NULL, '250 mg', '2×/gün', '10 gün', NULL, NULL, NULL, NULL, 1, 'Penisilin alerjisi varsa');

-- Klindamisin - Pediatrik
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(2, 4, 'pediatric', 0, NULL, NULL, NULL, '30-40 mg/kg/gün', '3 doza bölünmüş', '10 gün', NULL, NULL, NULL, NULL, 1, 'Penisilin alerjisi varsa');

-- Klindamisin - Yetişkin
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(2, 4, 'adult', 216, NULL, NULL, NULL, '150-450 mg', '3×/gün', '10 gün', NULL, NULL, NULL, NULL, 1, 'Penisilin alerjisi varsa');

-- Treatment 3: Semptomatik tedavi (Ağrı ve ateş)
-- Parasetamol - Pediatrik
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(3, 5, 'pediatric', 0, NULL, NULL, 30, '15 mg/kg/gün', '6-8 saatte bir', 'semptom süresince', '60 mg/kg/gün', NULL, NULL, NULL, 0, NULL),
(3, 5, 'pediatric', 0, NULL, 30, NULL, '15 mg/kg/gün', '6-8 saatte bir', 'semptom süresince', '2000 mg/gün', '500 mg/doz', NULL, '30 kg ve üstü çocuklar', 0, NULL);

-- Parasetamol - Yetişkin
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(3, 5, 'adult', 216, NULL, NULL, NULL, '1000 mg', 'günde 4 defaya kadar', 'semptom süresince', '4000 mg', '1000 mg', NULL, NULL, 0, NULL);

-- İbuprofen 100mg/5ml - Pediatrik (6 ay-12 yaş)
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(3, 6, 'pediatric', 6, 144, 7, NULL, '4-10 mg/kg/doz', '6-8 saatte bir', 'semptom süresince', '1200 mg/gün veya 40 mg/kg/gün', '400 mg/doz', NULL, 'İbuprofen 100mg/5ml şurup', 0, NULL);

-- İbuprofen 200mg/5ml - Pediatrik (6-12 yaş, 18 kg üstü)
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(3, 6, 'pediatric', 72, 144, 18, NULL, '5-10 mg/kg/doz', 'günde 3-4 kez', 'semptom süresince', '40 mg/kg/gün', '400 mg/doz', NULL, 'İbuprofen 200mg/5ml şurup', 0, NULL);

-- İbuprofen - Yetişkin
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(3, 6, 'adult', 216, NULL, NULL, NULL, '200-400 mg/doz', '6-8 saatte bir', 'semptom süresince', '1200 mg', '400 mg', NULL, NULL, 0, NULL);

-- ==========================================
-- VİRAL FARENJİT DOZAJLARI
-- ==========================================

-- Treatment 5: Ağrı ve ateş kontrolü (VİRAL FARENJİT için aynı dozajlar)
-- Parasetamol - Pediatrik
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(5, 5, 'pediatric', 0, NULL, NULL, 30, '15 mg/kg/gün', '6-8 saatte bir', 'semptom süresince', '60 mg/kg/gün', NULL, NULL, NULL, 0, NULL),
(5, 5, 'pediatric', 0, NULL, 30, NULL, '15 mg/kg/gün', '6-8 saatte bir', 'semptom süresince', '2000 mg/gün', '500 mg/doz', NULL, '30 kg ve üstü çocuklar', 0, NULL);

-- Parasetamol - Yetişkin
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(5, 5, 'adult', 216, NULL, NULL, NULL, '1000 mg', 'günde 4 defaya kadar', 'semptom süresince', '4000 mg', '1000 mg', NULL, NULL, 0, NULL);

-- İbuprofen - Pediatrik
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(5, 6, 'pediatric', 6, 144, 7, NULL, '4-10 mg/kg/doz', '6-8 saatte bir', 'semptom süresince', '1200 mg/gün veya 40 mg/kg/gün', '400 mg/doz', NULL, 'İbuprofen 100mg/5ml', 0, NULL),
(5, 6, 'pediatric', 72, 144, 18, NULL, '5-10 mg/kg/doz', 'günde 3-4 kez', 'semptom süresince', '40 mg/kg/gün', '400 mg/doz', NULL, 'İbuprofen 200mg/5ml', 0, NULL);

-- İbuprofen - Yetişkin
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(5, 6, 'adult', 216, NULL, NULL, NULL, '200-400 mg/doz', '6-8 saatte bir', 'semptom süresince', '1200 mg', '400 mg', NULL, NULL, 0, NULL);

-- Treatment 7: Burun tıkanıklığı tedavisi (Viral Farenjit)
-- Topikal dekonjestan - Pediatrik (İliadin/Otrivine pediatrik)
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(7, 11, 'pediatric', 72, NULL, NULL, NULL, '1 puff', 'günde 2 kez', 'maksimum 5 gün', NULL, NULL, 'her iki burun deliğine', 'Kullanım 5 günü geçmemeli', 0, NULL),
(7, 12, 'pediatric', 72, NULL, NULL, NULL, '1 puff', 'günde 2 kez', 'maksimum 5 gün', NULL, NULL, 'her iki burun deliğine', 'Kullanım 5 günü geçmemeli', 0, NULL);

-- Topikal dekonjestan - Yetişkin
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(7, 11, 'adult', 216, NULL, NULL, NULL, '1-2 puff', 'günde 2-3 kez', 'maksimum 5-7 gün', NULL, NULL, 'her iki burun deliğine', 'Kullanım 5-7 günü geçmemeli', 0, NULL),
(7, 12, 'adult', 216, NULL, NULL, NULL, '1-2 puff', 'günde 2-3 kez', 'maksimum 5-7 gün', NULL, NULL, 'her iki burun deliğine', 'Kullanım 5-7 günü geçmemeli', 0, NULL);

-- ==========================================
-- LARENJİT DOZAJLARI
-- ==========================================

-- Treatment 10: Semptomatik tedavi (Larenjit - Parasetamol ve İbuprofen)
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
-- Parasetamol
(10, 5, 'pediatric', 0, NULL, NULL, 30, '15 mg/kg/gün', '6-8 saatte bir', 'semptom süresince', '60 mg/kg/gün', NULL, NULL, NULL, 0, NULL),
(10, 5, 'pediatric', 0, NULL, 30, NULL, '15 mg/kg/gün', '6-8 saatte bir', 'semptom süresince', '2000 mg/gün', '500 mg/doz', NULL, NULL, 0, NULL),
(10, 5, 'adult', 216, NULL, NULL, NULL, '1000 mg', 'günde 4 defaya kadar', 'semptom süresince', '4000 mg', '1000 mg', NULL, NULL, 0, NULL),
-- İbuprofen
(10, 6, 'pediatric', 6, 144, 7, NULL, '4-10 mg/kg/doz', '6-8 saatte bir', 'semptom süresince', '1200 mg/gün veya 40 mg/kg/gün', '400 mg/doz', NULL, NULL, 0, NULL),
(10, 6, 'pediatric', 72, 144, 18, NULL, '5-10 mg/kg/doz', 'günde 3-4 kez', 'semptom süresince', '40 mg/kg/gün', '400 mg/doz', NULL, NULL, 0, NULL),
(10, 6, 'adult', 216, NULL, NULL, NULL, '200-400 mg/doz', '6-8 saatte bir', 'semptom süresince', '1200 mg', '400 mg', NULL, NULL, 0, NULL);

-- Treatment 11: Antitüsif (Larenjit)
-- Levodropropizin (LEVOPRONT) - Pediatrik
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(11, 15, 'pediatric', 0, NULL, 10, 20, '3 ml', 'günde 3 kez, en az 6 saat ara ile', 'maksimum 7 gün', '9 ml', '3 ml', NULL, '10-20 kg arası', 0, NULL),
(11, 15, 'pediatric', 0, NULL, 20, 30, '5 ml', 'günde 3 kez, en az 6 saat ara ile', 'maksimum 7 gün', '15 ml', '5 ml', NULL, '20-30 kg arası', 0, NULL),
(11, 15, 'pediatric', 0, NULL, 30, NULL, '10 ml', 'günde 3 kez, en az 6 saat ara ile', 'maksimum 7 gün', '30 ml', '10 ml', NULL, '30 kg üstü', 0, NULL);

-- Levodropropizin - Yetişkin
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(11, 15, 'adult', 216, NULL, NULL, NULL, '10 ml (60 mg)', 'günde 3 kez, en az 6 saat ara ile', 'ihtiyaç süresince', '30 ml', '10 ml', NULL, NULL, 0, NULL);

-- Dextromethorphan (MUKORAL) - Pediatrik
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(11, 16, 'pediatric', 0, 24, NULL, NULL, '2.5 ml', 'günde 2 kez', 'ihtiyaç süresince', '5 ml', '2.5 ml', NULL, '0-2 yaş arası', 0, NULL),
(11, 16, 'pediatric', 24, 60, NULL, NULL, '2.5 ml', 'günde 3 kez', 'ihtiyaç süresince', '7.5 ml', '2.5 ml', NULL, '2-5 yaş arası', 0, NULL),
(11, 16, 'pediatric', 60, 144, NULL, NULL, '5 ml', 'günde 2-3 kez', 'ihtiyaç süresince', '15 ml', '5 ml', NULL, '5-12 yaş arası', 0, NULL);

-- Treatment 12: Antibiyotik (Larenjit - sadece spesifik durumlarda, Tonsillit ile aynı)
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(12, 1, 'pediatric', 1, NULL, NULL, 40, '90 mg/kg/gün', 'günde 2 kez', '10 gün', NULL, NULL, NULL, '28 günden büyük, Kreatinin >30', 0, NULL),
(12, 1, 'adult', 216, NULL, NULL, NULL, '1000 mg', 'günde 2 kez', '10 gün', NULL, NULL, NULL, NULL, 0, NULL),
-- Alternatifler
(12, 2, 'pediatric', 1, NULL, NULL, NULL, '5-12 mg/kg/gün', 'tek doz', '5 gün', '500 mg/gün', NULL, NULL, 'Yaş >28 gün', 1, 'Penisilin alerjisi'),
(12, 2, 'adult', 216, NULL, NULL, NULL, '500 mg', '1×/gün', '5 gün', NULL, NULL, NULL, NULL, 1, 'Penisilin alerjisi'),
(12, 3, 'pediatric', 0, NULL, NULL, NULL, '15 mg/kg', 'günde 2 kez', '10 gün', '1000 mg', NULL, NULL, NULL, 1, 'Penisilin alerjisi'),
(12, 3, 'adult', 216, NULL, NULL, NULL, '250 mg', '2×/gün', '10 gün', NULL, NULL, NULL, NULL, 1, 'Penisilin alerjisi'),
(12, 4, 'pediatric', 0, NULL, NULL, NULL, '30-40 mg/kg/gün', '3 doza bölünmüş', '10 gün', NULL, NULL, NULL, NULL, 1, 'Penisilin alerjisi'),
(12, 4, 'adult', 216, NULL, NULL, NULL, '150-450 mg', '3×/gün', '10 gün', NULL, NULL, NULL, NULL, 1, 'Penisilin alerjisi');

-- ==========================================
-- VİRAL RİNİT DOZAJLARI
-- ==========================================

-- Treatment 13: Burun tıkanıklığı tedavisi (Viral Rinit - Dekonjestanlar)
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
-- Pediatrik topikal dekonjestanlar
(13, 11, 'pediatric', 72, NULL, NULL, NULL, '1 puff', 'günde 2 kez', 'maksimum 5 gün', NULL, NULL, 'her iki burun deliğine', '6 yaş altı önerilmez', 0, NULL),
(13, 12, 'pediatric', 72, NULL, NULL, NULL, '1 puff', 'günde 2 kez', 'maksimum 5 gün', NULL, NULL, 'her iki burun deliğine', '6 yaş altı önerilmez', 0, NULL),
-- Yetişkin topikal dekonjestanlar
(13, 11, 'adult', 216, NULL, NULL, NULL, '1-2 puff', 'günde 2-3 kez', 'maksimum 5-7 gün', NULL, NULL, 'her iki burun deliğine', NULL, 0, NULL),
(13, 12, 'adult', 216, NULL, NULL, NULL, '1-2 puff', 'günde 2-3 kez', 'maksimum 5-7 gün', NULL, NULL, 'her iki burun deliğine', NULL, 0, NULL);

-- Treatment 14: Antihistaminik (Viral Rinit)
-- Ketotifen (ZADİTEN)
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(14, 7, 'pediatric', 6, 36, NULL, NULL, '0.25 ml/kg', 'günde 2 kez', 'semptom süresince', NULL, NULL, 'sabah ve akşam', '6 ay - 3 yaş', 0, NULL),
(14, 7, 'pediatric', 36, 204, NULL, NULL, '5 ml', 'günde 2 kez', 'semptom süresince', '10 ml', '5 ml', 'kahvaltı ve akşam yemeği ile', '3-17 yaş', 0, NULL);

-- Setirizin (ZYRTEC, CETRYN)
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(14, 8, 'pediatric', 24, 72, NULL, NULL, '2.5 ml', 'günde 2 kez', 'semptom süresince', '5 ml', '2.5 ml', NULL, '2-6 yaş', 0, NULL),
(14, 8, 'pediatric', 72, 144, NULL, NULL, '5 ml', 'günde 2 kez', 'semptom süresince', '10 ml', '5 ml', NULL, '6-12 yaş', 0, NULL),
(14, 8, 'pediatric', 144, NULL, NULL, NULL, '10 ml', 'günde 1 kez', 'semptom süresince', '10 ml', '10 ml', NULL, '12 yaş üstü', 0, NULL),
(14, 8, 'adult', 216, NULL, NULL, NULL, '10 mg (1 tablet)', 'günde 1 kez', 'semptom süresince', '10 mg', '10 mg', NULL, NULL, 0, NULL);

-- Desloratadin (DELODAY)
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(14, 9, 'pediatric', 6, 12, NULL, NULL, '2 ml (1 mg)', 'günde 1 kez', 'semptom süresince', '2 ml', '2 ml', NULL, '6 ay - 11 ay', 0, NULL),
(14, 9, 'pediatric', 12, 60, NULL, NULL, '2.5 ml (1.25 mg)', 'günde 1 kez', 'semptom süresince', '2.5 ml', '2.5 ml', NULL, '1-5 yaş', 0, NULL),
(14, 9, 'pediatric', 60, 132, NULL, NULL, '5 ml (2.5 mg)', 'günde 1 kez', 'semptom süresince', '5 ml', '5 ml', NULL, '6-11 yaş', 0, NULL),
(14, 9, 'pediatric', 144, NULL, NULL, NULL, '10 ml (5 mg)', 'günde 1 kez', 'semptom süresince', '10 ml', '10 ml', NULL, '12 yaş üstü', 0, NULL),
(14, 9, 'adult', 216, NULL, NULL, NULL, '5 mg', 'günde 1 kez', 'semptom süresince', '5 mg', '5 mg', NULL, NULL, 0, NULL);

-- Bilastin (BİLAXTEN, AERIUS)
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(14, 10, 'pediatric', 144, NULL, NULL, NULL, '1 tablet', 'günde 1 kez', 'semptom süresince', '1 tablet', '1 tablet', 'aç karnına', '12 yaş üstü', 0, NULL),
(14, 10, 'adult', 216, NULL, NULL, NULL, '1-2 tablet', 'günde 1 kez', 'semptom süresince', '2 tablet', '2 tablet', 'aç karnına', NULL, 0, NULL);

-- Treatment 15: Ağrı ve ateş (Viral Rinit - aynı dozajlar)
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(15, 5, 'pediatric', 0, NULL, NULL, 30, '15 mg/kg/gün', '6-8 saatte bir', 'semptom süresince', '60 mg/kg/gün', NULL, NULL, NULL, 0, NULL),
(15, 5, 'pediatric', 0, NULL, 30, NULL, '15 mg/kg/gün', '6-8 saatte bir', 'semptom süresince', '2000 mg/gün', '500 mg/doz', NULL, NULL, 0, NULL),
(15, 5, 'adult', 216, NULL, NULL, NULL, '1000 mg', 'günde 4 defaya kadar', 'semptom süresince', '4000 mg', '1000 mg', NULL, NULL, 0, NULL),
(15, 6, 'pediatric', 6, 144, 7, NULL, '4-10 mg/kg/doz', '6-8 saatte bir', 'semptom süresince', '1200 mg/gün veya 40 mg/kg/gün', '400 mg/doz', NULL, NULL, 0, NULL),
(15, 6, 'pediatric', 72, 144, 18, NULL, '5-10 mg/kg/doz', 'günde 3-4 kez', 'semptom süresince', '40 mg/kg/gün', '400 mg/doz', NULL, NULL, 0, NULL),
(15, 6, 'adult', 216, NULL, NULL, NULL, '200-400 mg/doz', '6-8 saatte bir', 'semptom süresince', '1200 mg', '400 mg', NULL, NULL, 0, NULL);

-- ==========================================
-- BAKTERİYEL SİNÜZİT DOZAJLARI
-- ==========================================

-- Treatment 18: Analjezik-Antipiretik (Sinüzit - aynı dozajlar)
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(18, 5, 'pediatric', 0, NULL, NULL, 30, '15 mg/kg/gün', '6-8 saatte bir', 'semptom süresince', '60 mg/kg/gün', NULL, NULL, NULL, 0, NULL),
(18, 5, 'pediatric', 0, NULL, 30, NULL, '15 mg/kg/gün', '6-8 saatte bir', 'semptom süresince', '2000 mg/gün', '500 mg/doz', NULL, NULL, 0, NULL),
(18, 5, 'adult', 216, NULL, NULL, NULL, '1000 mg', 'günde 4 defaya kadar', 'semptom süresince', '4000 mg', '1000 mg', NULL, NULL, 0, NULL),
(18, 6, 'pediatric', 6, 144, 7, NULL, '4-10 mg/kg/doz', '6-8 saatte bir', 'semptom süresince', '1200 mg/gün veya 40 mg/kg/gün', '400 mg/doz', NULL, NULL, 0, NULL),
(18, 6, 'pediatric', 72, 144, 18, NULL, '5-10 mg/kg/doz', 'günde 3-4 kez', 'semptom süresince', '40 mg/kg/gün', '400 mg/doz', NULL, NULL, 0, NULL),
(18, 6, 'adult', 216, NULL, NULL, NULL, '200-400 mg/doz', '6-8 saatte bir', 'semptom süresince', '1200 mg', '400 mg', NULL, NULL, 0, NULL);

-- Treatment 19: Dekonjestan (Sinüzit)
-- Topikal dekonjestanlar (aynı dozajlar)
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(19, 11, 'pediatric', 72, NULL, NULL, NULL, '1 puff', 'günde 2 kez', 'maksimum 5 gün', NULL, NULL, 'her iki burun deliğine', NULL, 0, NULL),
(19, 12, 'pediatric', 72, NULL, NULL, NULL, '1 puff', 'günde 2 kez', 'maksimum 5 gün', NULL, NULL, 'her iki burun deliğine', NULL, 0, NULL),
(19, 11, 'adult', 216, NULL, NULL, NULL, '1-2 puff', 'günde 2-3 kez', 'maksimum 5-7 gün', NULL, NULL, 'her iki burun deliğine', NULL, 0, NULL),
(19, 12, 'adult', 216, NULL, NULL, NULL, '1-2 puff', 'günde 2-3 kez', 'maksimum 5-7 gün', NULL, NULL, 'her iki burun deliğine', NULL, 0, NULL);

-- Oral dekonjestanlar (Sinüzit)
-- SUDAFED şurup
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(19, 13, 'pediatric', 72, 132, NULL, NULL, '5 ml', 'günde 3-4 kez', 'semptom süresince', '20 ml', '5 ml', NULL, '6-11 yaş', 0, NULL),
(19, 13, 'pediatric', 144, NULL, NULL, NULL, '10 ml', 'günde 3-4 kez', 'semptom süresince', '40 ml', '10 ml', NULL, '12 yaş üstü', 0, NULL),
(19, 13, 'adult', 216, NULL, NULL, NULL, '10 ml veya 1 tablet', 'günde 3-4 kez', 'semptom süresince', '40 ml veya 4 tablet', '10 ml veya 1 tablet', NULL, NULL, 0, NULL);

-- COLDAWAY-C, NUROFEN-COLD-FLU
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(19, 14, 'pediatric', 144, NULL, NULL, NULL, '2 tablet başlangıç, sonra 1-2 tablet', 'her 4-6 saatte', 'semptom süresince', NULL, '2 tablet', NULL, '12 yaş üstü', 0, NULL),
(19, 14, 'adult', 216, NULL, NULL, NULL, '2 tablet başlangıç, sonra 1-2 tablet', 'her 4-6 saatte', 'semptom süresince', NULL, '2 tablet', NULL, NULL, 0, NULL);

-- Treatment 20: Antibiyotik (Sinüzit)
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(20, 1, 'pediatric', 1, NULL, NULL, 40, '90 mg/kg/gün', 'günde 2 kez', '10 gün', NULL, NULL, NULL, '28 günden büyük, Kreatinin >30', 0, NULL),
(20, 1, 'adult', 216, NULL, NULL, NULL, '1000 mg', 'günde 2 kez', '10 gün', NULL, NULL, NULL, NULL, 0, NULL),
-- Alternatif (Klindamisin)
(20, 4, 'pediatric', 0, NULL, NULL, NULL, '30-40 mg/kg/gün', '3 doza bölünmüş', '10 gün', NULL, NULL, NULL, NULL, 1, 'Penisilin alerjisi'),
(20, 4, 'adult', 216, NULL, NULL, NULL, '150-450 mg', '3×/gün', '10 gün', NULL, NULL, NULL, NULL, 1, 'Penisilin alerjisi');

-- Treatment 21: Nazal Steroid (Sinüzit)
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(21, 17, 'pediatric', 24, NULL, NULL, NULL, '1 doz', 'günde 2 kez', 'ihtiyaç süresince', '2 doz', '1 doz', 'her iki burun deliğine', '2 yaş üstü', 0, NULL),
(21, 17, 'adult', 216, NULL, NULL, NULL, '2 doz', 'günde 2 kez', 'ihtiyaç süresince', '4 doz', '2 doz', 'her iki burun deliğine', NULL, 0, NULL);

-- ==========================================
-- AKUT OTİTİS MEDİA DOZAJLARI
-- ==========================================

-- Treatment 22: Ateş düşürücü ve ağrı kesici (Otitis Media - aynı dozajlar)
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(22, 5, 'pediatric', 0, NULL, NULL, 30, '15 mg/kg/gün', '6-8 saatte bir', 'semptom süresince', '60 mg/kg/gün', NULL, NULL, NULL, 0, NULL),
(22, 5, 'pediatric', 0, NULL, 30, NULL, '15 mg/kg/gün', '6-8 saatte bir', 'semptom süresince', '2000 mg/gün', '500 mg/doz', NULL, NULL, 0, NULL),
(22, 5, 'adult', 216, NULL, NULL, NULL, '1000 mg', 'günde 4 defaya kadar', 'semptom süresince', '4000 mg', '1000 mg', NULL, NULL, 0, NULL),
(22, 6, 'pediatric', 6, 144, 7, NULL, '4-10 mg/kg/doz', '6-8 saatte bir', 'semptom süresince', '1200 mg/gün veya 40 mg/kg/gün', '400 mg/doz', NULL, NULL, 0, NULL),
(22, 6, 'pediatric', 72, 144, 18, NULL, '5-10 mg/kg/doz', 'günde 3-4 kez', 'semptom süresince', '40 mg/kg/gün', '400 mg/doz', NULL, NULL, 0, NULL),
(22, 6, 'adult', 216, NULL, NULL, NULL, '200-400 mg/doz', '6-8 saatte bir', 'semptom süresince', '1200 mg', '400 mg', NULL, NULL, 0, NULL);

-- Treatment 23: Burun tıkanıklığı (Otitis Media - aynı topikal dekonjestanlar)
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(23, 11, 'pediatric', 72, NULL, NULL, NULL, '1 puff', 'günde 2 kez', 'maksimum 5 gün', NULL, NULL, 'her iki burun deliğine', NULL, 0, NULL),
(23, 12, 'pediatric', 72, NULL, NULL, NULL, '1 puff', 'günde 2 kez', 'maksimum 5 gün', NULL, NULL, 'her iki burun deliğine', NULL, 0, NULL),
(23, 11, 'adult', 216, NULL, NULL, NULL, '1-2 puff', 'günde 2-3 kez', 'maksimum 5-7 gün', NULL, NULL, 'her iki burun deliğine', NULL, 0, NULL),
(23, 12, 'adult', 216, NULL, NULL, NULL, '1-2 puff', 'günde 2-3 kez', 'maksimum 5-7 gün', NULL, NULL, 'her iki burun deliğine', NULL, 0, NULL);

-- Treatment 25: Kulak damlası (Otitis Media)
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(25, 20, 'pediatric', 0, NULL, NULL, NULL, '2-3 damla', 'günde 2-3 kez', 'semptom süresince', NULL, NULL, 'kulağa damlatma', 'OTİPAX', 0, NULL),
(25, 20, 'adult', 216, NULL, NULL, NULL, '3-4 damla', 'günde 2-3 kez', 'semptom süresince', NULL, NULL, 'kulağa damlatma', 'OTİPAX', 0, NULL);

-- Treatment 26: Antibiyotik (Otitis Media - aynı antibiyotikler)
INSERT INTO medications_dosages (treatment_id, medication_id, patient_type, age_min, age_max, weight_min, weight_max, dose, frequency, duration, max_daily_dose, max_single_dose, administration, notes, is_alternative, allergy_info) VALUES 
(26, 1, 'pediatric', 1, NULL, NULL, 40, '90 mg/kg/gün', 'günde 2 kez', '10 gün', NULL, NULL, NULL, '28 günden büyük, Kreatinin >30', 0, NULL),
(26, 1, 'adult', 216, NULL, NULL, NULL, '1000 mg', 'günde 2 kez', '10 gün', NULL, NULL, NULL, NULL, 0, NULL),
-- Alternatifler
(26, 2, 'pediatric', 1, NULL, NULL, NULL, '5-12 mg/kg/gün', 'tek doz', '5 gün', '500 mg/gün', NULL, NULL, 'Yaş >28 gün', 1, 'Penisilin alerjisi'),
(26, 2, 'adult', 216, NULL, NULL, NULL, '500 mg', '1×/gün', '5 gün', NULL, NULL, NULL, NULL, 1, 'Penisilin alerjisi'),
(26, 3, 'pediatric', 0, NULL, NULL, NULL, '15 mg/kg', 'günde 2 kez', '10 gün', '1000 mg', NULL, NULL, NULL, 1, 'Penisilin alerjisi'),
(26, 3, 'adult', 216, NULL, NULL, NULL, '250 mg', '2×/gün', '10 gün', NULL, NULL, NULL, NULL, 1, 'Penisilin alerjisi'),
(26, 4, 'pediatric', 0, NULL, NULL, NULL, '30-40 mg/kg/gün', '3 doza bölünmüş', '10 gün', NULL, NULL, NULL, NULL, 1, 'Penisilin alerjisi'),
(26, 4, 'adult', 216, NULL, NULL, NULL, '150-450 mg', '3×/gün', '10 gün', NULL, NULL, NULL, NULL, 1, 'Penisilin alerjisi');

-- 10. DESTEK TEDAVİLERİ

-- Genel destekleyici önlemler (tüm hastalıklar için)
INSERT INTO supportive_care (disease_id, category, title, description, priority) VALUES 
-- Tonsillit
(2, 'hidrasyon', 'Bol sıvı alımı', 'Bol su, çorba, ılık içecekler', 1),
(2, 'istirahat', 'İstirahat', 'Yeterli dinlenme', 1),
(2, 'gargara', 'Tuzlu su gargarası', '1 çay kaşığı tuz + 1 bardak ılık su ile gargara', 2),
(2, 'kortikosteroid', 'Kortikosteroid', 'Tek doz deksametazon, ciddi ödemde, şiddetli disfajide', 3),

-- Viral Farenjit
(3, 'gargara', 'Ilık tuzlu su gargarası', '1 çay kaşığı tuz + 1 bardak ılık su', 1),
(3, 'hidrasyon', 'Ballı ılık içecekler', '2 yaş altı hariç', 1),
(3, 'antiseptik', 'Boğaz pastilleri', 'Büyük çocuk/erişkinde antiseptikli spreyler', 2),
(3, 'nem', 'Nemli hava', 'Buhar inhalasyonu, burun açıcı serumlar', 2),
(3, 'hidrasyon', 'Bol sıvı', 'Su, çorba, ılık içecekler', 1),
(3, 'istirahat', 'İstirahat', 'Yeterli dinlenme', 1),
(3, 'irritanlardan_kacinma', 'İrritanlardan uzak durma', 'Sigara, alkol, baharatlı yiyeceklerden kaçınma', 2),

-- Larenjit
(4, 'ses_istirahati', 'Ses istirahati', 'En önemli tedavi, fısıltı bile YASAK, konuşma minimum, 3-5 gün istirahat', 1),
(4, 'hidrasyon', 'Bol ılık sıvı', 'Ağızdan alınan sıvılar mukozayı nemlendirir', 1),
(4, 'nem', 'Ortam havası nemli olmalı', 'Buhar inhalasyonu faydalıdır', 1),

-- Viral Rinit
(1, 'hidrasyon', 'Bol sıvı alımı', 'Su, çorba, ılık içecekler', 1),
(1, 'nem', 'Oda nemini artırma', 'Ortam havası nemli tutulmalı', 1),
(1, 'irritanlardan_kacinma', 'Sigara dumanından uzak durma', 'Pasif sigara içiciliğinden kaçınılmalı', 1),
(1, 'istirahat', 'Yeterli istirahat', 'Vücut dinlendirilmeli', 1),

-- Bakteriyel Sinüzit
(5, 'burun_yikama', 'Serum fizyolojik ile burun yıkama', 'Düzenli burun yıkama', 1),
(5, 'nem', 'Nemli hava', 'Ortam havası nemli tutulmalı', 1),
(5, 'hidrasyon', 'Bol sıvı alımı', 'Yeterli hidrasyon', 1),
(5, 'irritanlardan_kacinma', 'İrritanlardan kaçınma', 'Sigara, parfüm gibi irritanlardan uzak durulmalı', 1),
(5, 'takip', '48-72 saat takip', '48-72 saatte düzelme beklenir, düzelmez veya kötüleşirse antibiyotik değişimi, sinüs grafi/BT, KBB konsültasyonu', 2),

-- Akut Otitis Media
(6, 'hidrasyon', 'Bol sıvı', 'Yeterli sıvı alımı', 1),
(6, 'nazal_aspirasyon', 'Nazal aspirasyon', 'Burun aspiratörü ile burun temizliği', 1),
(6, 'istirahat', 'İstirahat', 'Çocuğun rahat etmesi için uygun ortam', 1);

-- =====================================================
-- VERİ GİRİŞİ TAMAMLANDI
-- =====================================================
-- NOT: Yaşlar AY cinsinden girilmiştir:
-- 6 ay = 6
-- 1 yaş = 12 ay
-- 2 yaş = 24 ay
-- 6 yaş = 72 ay
-- 12 yaş = 144 ay
-- 18 yaş (yetişkin) = 216 ay
-- =====================================================
