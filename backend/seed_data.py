"""Скрипт для заполнения БД тестовыми данными"""
import asyncio
from datetime import datetime, timedelta
from database.connection import async_session
from database.models import (
    BoardMember, Partner, Charter, ChiefRheumatologist,
    Disease, News, RheumatologyCenter, CenterStaff
)
from functions.auth import get_password_hash
from database import User
from database.models import UserRole


async def seed_database():
    async with async_session() as db:
        # Check if data already exists
        from sqlalchemy import select
        result = await db.execute(select(BoardMember))
        if result.scalars().first():
            print("Database already has data. Skipping...")
            return

        print("Seeding database...")

        # ==================== АДМИН ====================
        admin = User(
            email="admin@revmatology.uz",
            hashed_password=get_password_hash("admin123"),
            last_name="Администратор",
            first_name="Системный",
            patronymic="",
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin)
        print("+ Admin created (admin@revmatology.uz / admin123)")

        # ==================== ЧЛЕНЫ ПРАВЛЕНИЯ ====================
        board_members = [
            BoardMember(
                last_name_ru="Мирахмедова",
                last_name_uz="Miraxmedova",
                last_name_en="Mirakhmedova",
                first_name_ru="Хилола",
                first_name_uz="Xilola",
                first_name_en="Khilola",
                patronymic_ru="Тўхтасиновна",
                patronymic_uz="To'xtasinovna",
                patronymic_en="Tukhtasinovna",
                position_ru="Председатель ассоциации",
                position_uz="Assotsiatsiya raisi",
                position_en="Chairman of the Association",
                degree_ru="Доктор медицинских наук, профессор",
                degree_uz="Tibbiyot fanlari doktori, professor",
                degree_en="Doctor of Medical Sciences, Professor",
                workplace_ru="Главный консультант по ревматологии МЗ РУз. Заведующая кафедрой пропедевтики внутренних болезней №1 ТашГосМУ",
                workplace_uz="O'zbekiston Respublikasi SSV bosh revmatolog-maslahatchisi. ToshDavTI 1-son ichki kasalliklar propedevtikasi kafedrasi mudiri",
                workplace_en="Chief Consultant in Rheumatology of the Ministry of Health of Uzbekistan. Head of the Department of Propaedeutics of Internal Diseases No.1, TashSMI",
                order=1,
                is_active=True
            ),
            BoardMember(
                last_name_ru="Набиева",
                last_name_uz="Nabiyeva",
                last_name_en="Nabieva",
                first_name_ru="Дилдорахон",
                first_name_uz="Dildoraxon",
                first_name_en="Dildorakhon",
                patronymic_ru="Абдумаликовна",
                patronymic_uz="Abdumalikovna",
                patronymic_en="Abdumalikovna",
                position_ru="Член правления",
                position_uz="Boshqaruv a'zosi",
                position_en="Board Member",
                degree_ru="Доктор медицинских наук, профессор",
                degree_uz="Tibbiyot fanlari doktori, professor",
                degree_en="Doctor of Medical Sciences, Professor",
                workplace_ru="Заведующая кафедрой факультетской и госпитальной терапии ТашГосМУ",
                workplace_uz="ToshDavTI fakultet va gospital terapiya kafedrasi mudiri",
                workplace_en="Head of the Department of Faculty and Hospital Therapy, TashSMI",
                order=2,
                is_active=True
            ),
        ]
        db.add_all(board_members)
        print("+ Board members added")

        # ==================== МЕЖДУНАРОДНЫЕ ПАРТНЁРЫ ====================
        partners = [
            Partner(
                name_ru="Европейская антиревматическая лига",
                name_uz="Yevropa antirevmatik ligasi",
                name_en="European League Against Rheumatism",
                short_name="EULAR",
                description_ru="Ведущая европейская организация в области ревматологии",
                description_uz="Revmatologiya sohasidagi yetakchi Yevropa tashkiloti",
                description_en="Leading European organization in rheumatology",
                website_url="https://www.eular.org",
                country_ru="Европа",
                country_uz="Yevropa",
                country_en="Europe",
                order=1,
                is_active=True
            ),
            Partner(
                name_ru="Азиатско-Тихоокеанская лига ассоциаций ревматологов",
                name_uz="Osiyo-Tinch okeani revmatologlar assotsiatsiyalari ligasi",
                name_en="Asia Pacific League of Associations for Rheumatology",
                short_name="APLAR",
                description_ru="Объединение ревматологических ассоциаций Азиатско-Тихоокеанского региона",
                description_uz="Osiyo-Tinch okeani mintaqasidagi revmatologiya assotsiatsiyalari birlashmasi",
                description_en="Union of rheumatological associations of the Asia-Pacific region",
                website_url="https://www.aplar.org",
                country_ru="Азия",
                country_uz="Osiyo",
                country_en="Asia",
                order=2,
                is_active=True
            ),
            Partner(
                name_ru="Ассоциация ревматологов России",
                name_uz="Rossiya revmatologlar assotsiatsiyasi",
                name_en="Association of Rheumatologists of Russia",
                short_name="АРР",
                description_ru="Профессиональное объединение ревматологов Российской Федерации",
                description_uz="Rossiya Federatsiyasi revmatologlarining kasbiy birlashmasi",
                description_en="Professional association of rheumatologists of the Russian Federation",
                website_url="https://rheumatolog.ru",
                country_ru="Россия",
                country_uz="Rossiya",
                country_en="Russia",
                order=3,
                is_active=True
            ),
        ]
        db.add_all(partners)
        print("+ Partners added")

        # ==================== УСТАВ ====================
        charter = Charter(
            title_ru="Устав Ассоциации ревматологов Узбекистана",
            title_uz="O'zbekiston revmatologlar assotsiatsiyasi ustavi",
            title_en="Charter of the Rheumatology Association of Uzbekistan",
            description_ru="Устав определяет цели, задачи и принципы деятельности Ассоциации ревматологов Узбекистана",
            description_uz="Ustav O'zbekiston revmatologlar assotsiatsiyasining maqsadlari, vazifalari va faoliyat tamoyillarini belgilaydi",
            description_en="The charter defines the goals, objectives and principles of the Rheumatology Association of Uzbekistan",
            file_url="/uploads/charter_placeholder.pdf",
            version="1.0",
            is_active=True
        )
        db.add(charter)
        print("+ Charter added")

        # ==================== РЕВМАТОЛОГИЧЕСКИЕ ЦЕНТРЫ ====================
        centers = [
            RheumatologyCenter(
                name_ru="Республиканский специализированный научно-практический медицинский центр терапии и медицинской реабилитации",
                name_uz="Respublika ixtisoslashtirilgan terapiya va tibbiy reabilitatsiya ilmiy-amaliy tibbiyot markazi",
                name_en="Republican Specialized Scientific and Practical Medical Center for Therapy and Medical Rehabilitation",
                description_ru="Ведущий центр ревматологической помощи в Узбекистане. Оказывает высокоспециализированную помощь пациентам с ревматическими заболеваниями.",
                description_uz="O'zbekistondagi yetakchi revmatologiya yordami markazi. Revmatik kasalliklar bilan og'rigan bemorlarga yuqori ixtisoslashtirilgan yordam ko'rsatadi.",
                description_en="Leading center for rheumatological care in Uzbekistan. Provides highly specialized care for patients with rheumatic diseases.",
                address_ru="г. Ташкент, Мирзо-Улугбекский район, ул. Тараккиёт, 71",
                address_uz="Toshkent sh., Mirzo Ulug'bek tumani, Taraqqiyot ko'chasi, 71",
                address_en="71 Taraqqiyot St., Mirzo Ulugbek district, Tashkent",
                phone="+998 71 234 56 78",
                email="info@rspmctr.uz",
                order=1,
                is_active=True
            ),
            RheumatologyCenter(
                name_ru="Клиника Ташкентской медицинской академии",
                name_uz="Toshkent tibbiyot akademiyasi klinikasi",
                name_en="Tashkent Medical Academy Clinic",
                description_ru="Многопрофильная клиника с отделением ревматологии. Проводит диагностику и лечение всех видов ревматических заболеваний.",
                description_uz="Revmatologiya bo'limi bilan ko'p tarmoqli klinika. Barcha turdagi revmatik kasalliklarni tashxislash va davolash.",
                description_en="Multidisciplinary clinic with rheumatology department. Diagnosis and treatment of all types of rheumatic diseases.",
                address_ru="г. Ташкент, Мирзо-Улугбекский район, ул. Фароби, 2",
                address_uz="Toshkent sh., Mirzo Ulug'bek tumani, Farobiy ko'chasi, 2",
                address_en="2 Farobi St., Mirzo Ulugbek district, Tashkent",
                phone="+998 71 267 89 12",
                email="clinic@tma.uz",
                order=2,
                is_active=True
            ),
            RheumatologyCenter(
                name_ru="Самаркандский областной многопрофильный медицинский центр",
                name_uz="Samarqand viloyati ko'p tarmoqli tibbiyot markazi",
                name_en="Samarkand Regional Multidisciplinary Medical Center",
                description_ru="Региональный центр ревматологической помощи для Самаркандской области и прилегающих регионов.",
                description_uz="Samarqand viloyati va qo'shni hududlar uchun mintaqaviy revmatologiya yordami markazi.",
                description_en="Regional rheumatology center for Samarkand region and surrounding areas.",
                address_ru="г. Самарканд, ул. Амира Темура, 45",
                address_uz="Samarqand sh., Amir Temur ko'chasi, 45",
                address_en="45 Amir Temur St., Samarkand",
                phone="+998 66 233 45 67",
                email="revma@sammc.uz",
                order=3,
                is_active=True
            ),
            RheumatologyCenter(
                name_ru="Бухарский областной многопрофильный медицинский центр",
                name_uz="Buxoro viloyati ko'p tarmoqli tibbiyot markazi",
                name_en="Bukhara Regional Multidisciplinary Medical Center",
                description_ru="Оказывает специализированную ревматологическую помощь жителям Бухарской области.",
                description_uz="Buxoro viloyati aholisiga ixtisoslashtirilgan revmatologik yordam ko'rsatadi.",
                description_en="Provides specialized rheumatological care to residents of Bukhara region.",
                address_ru="г. Бухара, ул. Навои, 12",
                address_uz="Buxoro sh., Navoiy ko'chasi, 12",
                address_en="12 Navoi St., Bukhara",
                phone="+998 65 221 34 56",
                email="revma@bukharamc.uz",
                order=4,
                is_active=True
            ),
            RheumatologyCenter(
                name_ru="Ферганский областной многопрофильный медицинский центр",
                name_uz="Farg'ona viloyati ko'p tarmoqli tibbiyot markazi",
                name_en="Fergana Regional Multidisciplinary Medical Center",
                description_ru="Центр ревматологической помощи для Ферганской долины.",
                description_uz="Farg'ona vodiysi uchun revmatologiya yordami markazi.",
                description_en="Rheumatology center for the Fergana Valley.",
                address_ru="г. Фергана, ул. Мустакиллик, 78",
                address_uz="Farg'ona sh., Mustaqillik ko'chasi, 78",
                address_en="78 Mustaqillik St., Fergana",
                phone="+998 73 244 56 78",
                email="revma@ferganamc.uz",
                order=5,
                is_active=True
            ),
        ]
        db.add_all(centers)
        print("+ Rheumatology centers added")

        # ==================== ГЛАВНЫЕ РЕВМАТОЛОГИ ====================
        chief_rheumatologists = [
            ChiefRheumatologist(
                last_name_ru="Каримов",
                last_name_uz="Karimov",
                last_name_en="Karimov",
                first_name_ru="Азиз",
                first_name_uz="Aziz",
                first_name_en="Aziz",
                patronymic_ru="Бахтиёрович",
                patronymic_uz="Baxtiyorovich",
                patronymic_en="Bakhtiyorovich",
                position_ru="Главный ревматолог Ташкентской области",
                position_uz="Toshkent viloyati bosh revmatologi",
                position_en="Chief Rheumatologist of Tashkent Region",
                degree_ru="Кандидат медицинских наук",
                degree_uz="Tibbiyot fanlari nomzodi",
                degree_en="Candidate of Medical Sciences",
                region_ru="Ташкентская область",
                region_uz="Toshkent viloyati",
                region_en="Tashkent Region",
                workplace_ru="Ташкентская областная клиническая больница",
                workplace_uz="Toshkent viloyat klinik shifoxonasi",
                workplace_en="Tashkent Regional Clinical Hospital",
                phone="+998 90 123 45 67",
                email="karimov@tashrevma.uz",
                order=1,
                is_active=True
            ),
            ChiefRheumatologist(
                last_name_ru="Рахимова",
                last_name_uz="Rahimova",
                last_name_en="Rakhimova",
                first_name_ru="Гульнора",
                first_name_uz="Gulnora",
                first_name_en="Gulnora",
                patronymic_ru="Садуллаевна",
                patronymic_uz="Sadullayevna",
                patronymic_en="Sadullayevna",
                position_ru="Главный ревматолог Самаркандской области",
                position_uz="Samarqand viloyati bosh revmatologi",
                position_en="Chief Rheumatologist of Samarkand Region",
                degree_ru="Доктор медицинских наук",
                degree_uz="Tibbiyot fanlari doktori",
                degree_en="Doctor of Medical Sciences",
                region_ru="Самаркандская область",
                region_uz="Samarqand viloyati",
                region_en="Samarkand Region",
                workplace_ru="Самаркандский государственный медицинский университет",
                workplace_uz="Samarqand davlat tibbiyot universiteti",
                workplace_en="Samarkand State Medical University",
                phone="+998 91 234 56 78",
                email="rakhimova@samrevma.uz",
                order=2,
                is_active=True
            ),
            ChiefRheumatologist(
                last_name_ru="Юсупов",
                last_name_uz="Yusupov",
                last_name_en="Yusupov",
                first_name_ru="Бахтиёр",
                first_name_uz="Baxtiyor",
                first_name_en="Bakhtiyor",
                patronymic_ru="Рустамович",
                patronymic_uz="Rustamovich",
                patronymic_en="Rustamovich",
                position_ru="Главный ревматолог Бухарской области",
                position_uz="Buxoro viloyati bosh revmatologi",
                position_en="Chief Rheumatologist of Bukhara Region",
                degree_ru="Кандидат медицинских наук",
                degree_uz="Tibbiyot fanlari nomzodi",
                degree_en="Candidate of Medical Sciences",
                region_ru="Бухарская область",
                region_uz="Buxoro viloyati",
                region_en="Bukhara Region",
                workplace_ru="Бухарский областной многопрофильный медицинский центр",
                workplace_uz="Buxoro viloyati ko'p tarmoqli tibbiyot markazi",
                workplace_en="Bukhara Regional Multidisciplinary Medical Center",
                phone="+998 92 345 67 89",
                email="yusupov@bukrevma.uz",
                order=3,
                is_active=True
            ),
            ChiefRheumatologist(
                last_name_ru="Абдуллаева",
                last_name_uz="Abdullayeva",
                last_name_en="Abdullayeva",
                first_name_ru="Нигора",
                first_name_uz="Nigora",
                first_name_en="Nigora",
                patronymic_ru="Камиловна",
                patronymic_uz="Kamilovna",
                patronymic_en="Kamilovna",
                position_ru="Главный ревматолог Ферганской области",
                position_uz="Farg'ona viloyati bosh revmatologi",
                position_en="Chief Rheumatologist of Fergana Region",
                degree_ru="Кандидат медицинских наук, доцент",
                degree_uz="Tibbiyot fanlari nomzodi, dotsent",
                degree_en="Candidate of Medical Sciences, Associate Professor",
                region_ru="Ферганская область",
                region_uz="Farg'ona viloyati",
                region_en="Fergana Region",
                workplace_ru="Ферганский филиал ТашГосМУ",
                workplace_uz="ToshDavTI Farg'ona filiali",
                workplace_en="Fergana Branch of TashSMI",
                phone="+998 93 456 78 90",
                email="abdullayeva@fergrevma.uz",
                order=4,
                is_active=True
            ),
            ChiefRheumatologist(
                last_name_ru="Ходжаев",
                last_name_uz="Xo'jayev",
                last_name_en="Khodjaev",
                first_name_ru="Шухрат",
                first_name_uz="Shuhrat",
                first_name_en="Shukhrat",
                patronymic_ru="Маматкулович",
                patronymic_uz="Mamatkulovich",
                patronymic_en="Mamatkulovich",
                position_ru="Главный ревматолог Хорезмской области",
                position_uz="Xorazm viloyati bosh revmatologi",
                position_en="Chief Rheumatologist of Khorezm Region",
                degree_ru="Кандидат медицинских наук",
                degree_uz="Tibbiyot fanlari nomzodi",
                degree_en="Candidate of Medical Sciences",
                region_ru="Хорезмская область",
                region_uz="Xorazm viloyati",
                region_en="Khorezm Region",
                workplace_ru="Хорезмский филиал ТашФармИ",
                workplace_uz="ToshFarmI Xorazm filiali",
                workplace_en="Khorezm Branch of TashPharmI",
                phone="+998 94 567 89 01",
                email="khodjaev@khrevma.uz",
                order=5,
                is_active=True
            ),
            ChiefRheumatologist(
                last_name_ru="Назарова",
                last_name_uz="Nazarova",
                last_name_en="Nazarova",
                first_name_ru="Дилором",
                first_name_uz="Dilorom",
                first_name_en="Dilorom",
                patronymic_ru="Олимовна",
                patronymic_uz="Olimovna",
                patronymic_en="Olimovna",
                position_ru="Главный ревматолог Андижанской области",
                position_uz="Andijon viloyati bosh revmatologi",
                position_en="Chief Rheumatologist of Andijan Region",
                degree_ru="Кандидат медицинских наук",
                degree_uz="Tibbiyot fanlari nomzodi",
                degree_en="Candidate of Medical Sciences",
                region_ru="Андижанская область",
                region_uz="Andijon viloyati",
                region_en="Andijan Region",
                workplace_ru="Андижанский государственный медицинский институт",
                workplace_uz="Andijon davlat tibbiyot instituti",
                workplace_en="Andijan State Medical Institute",
                phone="+998 95 678 90 12",
                email="nazarova@andrevma.uz",
                order=6,
                is_active=True
            ),
        ]
        db.add_all(chief_rheumatologists)
        print("+ Chief rheumatologists added")

        # ==================== ЗАБОЛЕВАНИЯ ====================
        diseases = [
            Disease(
                name_ru="Ревматоидный артрит",
                name_uz="Revmatoid artrit",
                name_en="Rheumatoid Arthritis",
                short_name="РА",
                description_ru="Хроническое системное воспалительное заболевание соединительной ткани с преимущественным поражением мелких суставов.",
                description_uz="Asosan mayda bo'g'imlar zararlanishi bilan birga keladigan biriktiruvchi to'qimaning surunkali tizimli yallig'lanish kasalligi.",
                description_en="Chronic systemic inflammatory disease of connective tissue with predominant involvement of small joints.",
                symptoms_ru="Утренняя скованность, симметричное поражение суставов, боль и отёк суставов, деформация суставов, общая слабость, повышение температуры.",
                symptoms_uz="Ertalabki qotishish, bo'g'imlarning simmetrik zararlanishi, bo'g'imlarda og'riq va shish, bo'g'imlar deformatsiyasi, umumiy holsizlik, harorat ko'tarilishi.",
                symptoms_en="Morning stiffness, symmetrical joint involvement, joint pain and swelling, joint deformation, general weakness, fever.",
                treatment_ru="Базисная терапия (метотрексат, лефлуномид), биологические препараты (ингибиторы ФНО-α), НПВП, глюкокортикоиды, физиотерапия.",
                treatment_uz="Bazis terapiya (metotreksat, leflunomid), biologik preparatlar (FNO-α inhibitorlari), NSAID, glyukokortikoidlar, fizioterapiya.",
                treatment_en="Basic therapy (methotrexate, leflunomide), biological agents (TNF-α inhibitors), NSAIDs, glucocorticoids, physiotherapy.",
                order=1,
                is_active=True
            ),
            Disease(
                name_ru="Системная красная волчанка",
                name_uz="Sistemali qizil yugurdak",
                name_en="Systemic Lupus Erythematosus",
                short_name="СКВ",
                description_ru="Системное аутоиммунное заболевание, при котором вырабатываемые иммунной системой антитела повреждают здоровые клетки.",
                description_uz="Immun tizimi tomonidan ishlab chiqarilgan antikorlar sog'lom hujayralarni zararlantadigan tizimli autoimmun kasallik.",
                description_en="Systemic autoimmune disease in which antibodies produced by the immune system damage healthy cells.",
                symptoms_ru="Сыпь на лице в форме бабочки, фотосенсибилизация, артралгии, поражение почек, лихорадка, выпадение волос, язвы во рту.",
                symptoms_uz="Yuzda kapalak shaklidagi toshma, fotosensibilizatsiya, artralgiya, buyrak zararlanishi, isitma, soch to'kilishi, og'izda yaralar.",
                symptoms_en="Butterfly rash on face, photosensitivity, arthralgia, kidney damage, fever, hair loss, mouth ulcers.",
                treatment_ru="Гидроксихлорохин, глюкокортикоиды, иммуносупрессанты (азатиоприн, микофенолат), биологические препараты (белимумаб).",
                treatment_uz="Gidroksixloroxin, glyukokortikoidlar, immunosupressantlar (azatioprin, mikofenolat), biologik preparatlar (belimumab).",
                treatment_en="Hydroxychloroquine, glucocorticoids, immunosuppressants (azathioprine, mycophenolate), biological agents (belimumab).",
                order=2,
                is_active=True
            ),
            Disease(
                name_ru="Подагра",
                name_uz="Podagra",
                name_en="Gout",
                short_name="",
                description_ru="Метаболическое заболевание, характеризующееся отложением кристаллов уратов в тканях и рецидивирующими приступами артрита.",
                description_uz="To'qimalarda urat kristallarining to'planishi va artritning takrorlanuvchi xurujlari bilan tavsiflanadigan metabolik kasallik.",
                description_en="Metabolic disease characterized by deposition of urate crystals in tissues and recurrent attacks of arthritis.",
                symptoms_ru="Острые приступы артрита (часто первый плюснефаланговый сустав), покраснение, отёк, сильная боль, тофусы, поражение почек.",
                symptoms_uz="Artritning o'tkir xurujlari (ko'pincha birinchi kaft-barmoq bo'g'imi), qizarish, shish, kuchli og'riq, tofuslar, buyrak zararlanishi.",
                symptoms_en="Acute arthritis attacks (often first metatarsophalangeal joint), redness, swelling, severe pain, tophi, kidney damage.",
                treatment_ru="Колхицин, НПВП, глюкокортикоиды при остром приступе. Аллопуринол, фебуксостат для снижения уровня мочевой кислоты.",
                treatment_uz="Kolxitsin, NSAID, o'tkir xuruj paytida glyukokortikoidlar. Siydik kislotasi darajasini pasaytirish uchun allopurinol, febuksostat.",
                treatment_en="Colchicine, NSAIDs, glucocorticoids for acute attacks. Allopurinol, febuxostat to reduce uric acid levels.",
                order=3,
                is_active=True
            ),
            Disease(
                name_ru="Анкилозирующий спондилит",
                name_uz="Ankilozlovchi spondilit",
                name_en="Ankylosing Spondylitis",
                short_name="АС",
                description_ru="Хроническое воспалительное заболевание позвоночника и крестцово-подвздошных суставов, приводящее к ограничению подвижности.",
                description_uz="Umurtqa pog'onasi va dumg'aza-yonbosh bo'g'imlarining surunkali yallig'lanish kasalligi, harakatlanish cheklanishiga olib keladi.",
                description_en="Chronic inflammatory disease of the spine and sacroiliac joints, leading to limited mobility.",
                symptoms_ru="Боль в нижней части спины и ягодицах, утренняя скованность, ограничение подвижности позвоночника, периферический артрит, увеит.",
                symptoms_uz="Belning pastki qismida va dumbalarda og'riq, ertalabki qotishish, umurtqa pog'onasi harakatchanligining cheklanishi, periferik artrit, uveit.",
                symptoms_en="Lower back and buttock pain, morning stiffness, limited spinal mobility, peripheral arthritis, uveitis.",
                treatment_ru="НПВП, ингибиторы ФНО-α (инфликсимаб, адалимумаб), ингибиторы ИЛ-17 (секукинумаб), лечебная физкультура.",
                treatment_uz="NSAID, FNO-α inhibitorlari (infliksimab, adalimumab), IL-17 inhibitorlari (sekukinumab), davolash jismoniy tarbiyasi.",
                treatment_en="NSAIDs, TNF-α inhibitors (infliximab, adalimumab), IL-17 inhibitors (secukinumab), therapeutic exercise.",
                order=4,
                is_active=True
            ),
            Disease(
                name_ru="Остеоартрит",
                name_uz="Osteoartrit",
                name_en="Osteoarthritis",
                short_name="ОА",
                description_ru="Дегенеративное заболевание суставов, характеризующееся разрушением суставного хряща и изменениями в субхондральной кости.",
                description_uz="Bo'g'im tog'ayining buzilishi va subxondral suyakdagi o'zgarishlar bilan tavsiflanadigan bo'g'imlarning degenerativ kasalligi.",
                description_en="Degenerative joint disease characterized by destruction of articular cartilage and changes in subchondral bone.",
                symptoms_ru="Боль в суставах при нагрузке, крепитация, ограничение подвижности, деформация суставов, утренняя скованность менее 30 минут.",
                symptoms_uz="Yuk tushganda bo'g'imlarda og'riq, krepitatsiya, harakatlanish cheklanishi, bo'g'imlar deformatsiyasi, 30 daqiqadan kam ertalabki qotishish.",
                symptoms_en="Joint pain on exertion, crepitus, limited mobility, joint deformation, morning stiffness less than 30 minutes.",
                treatment_ru="Снижение веса, лечебная физкультура, НПВП, внутрисуставные инъекции (гиалуроновая кислота, ГКС), эндопротезирование.",
                treatment_uz="Vazn yo'qotish, davolash jismoniy tarbiyasi, NSAID, bo'g'im ichiga in'ektsiyalar (gialuron kislotasi, GKS), endoprotezlash.",
                treatment_en="Weight loss, therapeutic exercise, NSAIDs, intra-articular injections (hyaluronic acid, corticosteroids), joint replacement.",
                order=5,
                is_active=True
            ),
            Disease(
                name_ru="Псориатический артрит",
                name_uz="Psoriatik artrit",
                name_en="Psoriatic Arthritis",
                short_name="ПсА",
                description_ru="Хроническое воспалительное заболевание суставов, ассоциированное с псориазом.",
                description_uz="Psoriaz bilan bog'liq bo'g'imlarning surunkali yallig'lanish kasalligi.",
                description_en="Chronic inflammatory joint disease associated with psoriasis.",
                symptoms_ru="Асимметричный олигоартрит, дактилит, энтезит, поражение ногтей, псориатические бляшки на коже.",
                symptoms_uz="Asimmetrik oligoartrit, daktilit, entezit, tirnoq zararlanishi, teridagi psoriatik dog'lar.",
                symptoms_en="Asymmetric oligoarthritis, dactylitis, enthesitis, nail involvement, psoriatic plaques on skin.",
                treatment_ru="НПВП, метотрексат, ингибиторы ФНО-α, ингибиторы ИЛ-17, ингибиторы ИЛ-23, апремиласт.",
                treatment_uz="NSAID, metotreksat, FNO-α inhibitorlari, IL-17 inhibitorlari, IL-23 inhibitorlari, apremilast.",
                treatment_en="NSAIDs, methotrexate, TNF-α inhibitors, IL-17 inhibitors, IL-23 inhibitors, apremilast.",
                order=6,
                is_active=True
            ),
        ]
        db.add_all(diseases)
        print("+ Diseases added")

        # ==================== НОВОСТИ И СОБЫТИЯ ====================
        news_items = [
            # Событие 1 - Конгресс (Featured)
            News(
                news_type="event",
                title_ru="III Конгресс ревматологов Узбекистана",
                title_uz="III O'zbekiston revmatologlar kongressi",
                title_en="III Congress of Rheumatologists of Uzbekistan",
                content_ru="Приглашаем всех специалистов принять участие в III Конгрессе ревматологов Узбекистана. В программе: пленарные заседания, мастер-классы, научные симпозиумы.",
                content_uz="Barcha mutaxassislarni III O'zbekiston revmatologlar kongressida ishtirok etishga taklif qilamiz. Dasturda: plenar yig'ilishlar, master-klasslar, ilmiy simpoziumlar.",
                content_en="We invite all specialists to participate in the III Congress of Rheumatologists of Uzbekistan. Program includes: plenary sessions, workshops, scientific symposiums.",
                excerpt_ru="Международный конгресс с участием ведущих экспертов",
                excerpt_uz="Yetakchi ekspertlar ishtirokida xalqaro kongress",
                excerpt_en="International congress with leading experts",
                event_date_start=datetime(2025, 3, 15, 9, 0),
                event_date_end=datetime(2025, 3, 17, 18, 0),
                event_location_ru="Ташкент, отель Intercontinental",
                event_location_uz="Toshkent, Intercontinental mehmonxonasi",
                event_location_en="Tashkent, Intercontinental Hotel",
                registration_url="https://congress.revmatology.uz",
                is_published=True,
                is_featured=True
            ),
            # Событие 2 - Школа ревматологов (Featured)
            News(
                news_type="event",
                title_ru="Школа ревматологов: Современные подходы к терапии",
                title_uz="Revmatologlar maktabi: Terapiyaga zamonaviy yondashuvlar",
                title_en="School of Rheumatologists: Modern Approaches to Therapy",
                content_ru="Образовательный курс для врачей-ревматологов, посвящённый современным методам диагностики и лечения ревматических заболеваний.",
                content_uz="Revmatik kasalliklarni tashxislash va davolashning zamonaviy usullariga bag'ishlangan revmatolog shifokorlar uchun ta'lim kursi.",
                content_en="Educational course for rheumatologists dedicated to modern methods of diagnosis and treatment of rheumatic diseases.",
                excerpt_ru="Образовательный курс для специалистов",
                excerpt_uz="Mutaxassislar uchun ta'lim kursi",
                excerpt_en="Educational course for specialists",
                event_date_start=datetime(2025, 4, 10, 10, 0),
                event_date_end=datetime(2025, 4, 12, 17, 0),
                event_location_ru="Ташкент, ТашГосМУ",
                event_location_uz="Toshkent, ToshDavTI",
                event_location_en="Tashkent, TashSMI",
                registration_url="https://school.revmatology.uz",
                is_published=True,
                is_featured=True
            ),
            # Новость 1
            News(
                news_type="news",
                title_ru="Новые рекомендации по лечению ревматоидного артрита",
                title_uz="Revmatoid artritni davolash bo'yicha yangi tavsiyalar",
                title_en="New recommendations for the treatment of rheumatoid arthritis",
                subtitle_ru="Обновлённые клинические рекомендации 2025 года",
                subtitle_uz="2025 yil uchun yangilangan klinik tavsiyalar",
                subtitle_en="Updated clinical recommendations for 2025",
                content_ru="Ассоциация опубликовала обновлённые клинические рекомендации по диагностике и лечению ревматоидного артрита. Новые рекомендации включают современные биологические препараты и таргетную терапию.",
                content_uz="Assotsiatsiya revmatoid artritni tashxislash va davolash bo'yicha yangilangan klinik tavsiyalarni e'lon qildi. Yangi tavsiyalar zamonaviy biologik preparatlar va maqsadli terapiyani o'z ichiga oladi.",
                content_en="The Association has published updated clinical recommendations for the diagnosis and treatment of rheumatoid arthritis. New recommendations include modern biological drugs and targeted therapy.",
                excerpt_ru="Рекомендации включают современные биологические препараты",
                excerpt_uz="Tavsiyalar zamonaviy biologik preparatlarni o'z ichiga oladi",
                excerpt_en="Recommendations include modern biological drugs",
                is_published=True,
                is_featured=False
            ),
            # Новость 2
            News(
                news_type="news",
                title_ru="Международное сотрудничество с EULAR",
                title_uz="EULAR bilan xalqaro hamkorlik",
                title_en="International cooperation with EULAR",
                subtitle_ru="Подписан меморандум о сотрудничестве",
                subtitle_uz="Hamkorlik to'g'risida memorandum imzolandi",
                subtitle_en="Memorandum of cooperation signed",
                content_ru="Ассоциация ревматологов Узбекистана подписала меморандум о сотрудничестве с Европейской антиревматической лигой (EULAR). Это откроет новые возможности для обучения и научного сотрудничества.",
                content_uz="O'zbekiston revmatologlar assotsiatsiyasi Yevropa antirevmatik ligasi (EULAR) bilan hamkorlik to'g'risida memorandum imzoladi. Bu ta'lim va ilmiy hamkorlik uchun yangi imkoniyatlar ochadi.",
                content_en="The Rheumatology Association of Uzbekistan has signed a memorandum of cooperation with the European League Against Rheumatism (EULAR). This will open new opportunities for training and scientific cooperation.",
                excerpt_ru="Новые возможности для обучения и сотрудничества",
                excerpt_uz="Ta'lim va hamkorlik uchun yangi imkoniyatlar",
                excerpt_en="New opportunities for training and cooperation",
                is_published=True,
                is_featured=False
            ),
            # Новость 3
            News(
                news_type="news",
                title_ru="Итоги Всемирного дня артрита",
                title_uz="Jahon artrit kuni yakunlari",
                title_en="World Arthritis Day Results",
                subtitle_ru="Мероприятия прошли по всей стране",
                subtitle_uz="Tadbirlar butun mamlakat bo'ylab o'tkazildi",
                subtitle_en="Events held across the country",
                content_ru="В рамках Всемирного дня артрита были проведены образовательные мероприятия для пациентов и врачей во всех регионах Узбекистана. Более 500 участников приняли участие в бесплатных консультациях.",
                content_uz="Jahon artrit kuni doirasida O'zbekistonning barcha mintaqalarida bemorlar va shifokorlar uchun ta'lim tadbirlari o'tkazildi. 500 dan ortiq ishtirokchi bepul maslahatlardan foydalandi.",
                content_en="As part of World Arthritis Day, educational events for patients and doctors were held in all regions of Uzbekistan. More than 500 participants took part in free consultations.",
                excerpt_ru="Более 500 участников приняли участие в мероприятиях",
                excerpt_uz="500 dan ortiq ishtirokchi tadbirlarda qatnashdi",
                excerpt_en="More than 500 participants took part in the events",
                is_published=True,
                is_featured=False
            ),
        ]
        db.add_all(news_items)
        print("+ News and events added")

        await db.commit()

        # ==================== CENTER STAFF ====================
        # Get center IDs after commit
        result = await db.execute(select(RheumatologyCenter))
        centers_list = result.scalars().all()

        center_staff = []
        if len(centers_list) >= 2:
            # Staff for first center
            center_staff.extend([
                CenterStaff(
                    center_id=centers_list[0].id,
                    last_name_ru="Исмаилова",
                    last_name_uz="Ismailova",
                    last_name_en="Ismailova",
                    first_name_ru="Малика",
                    first_name_uz="Malika",
                    first_name_en="Malika",
                    patronymic_ru="Рустамовна",
                    patronymic_uz="Rustamovna",
                    patronymic_en="Rustamovna",
                    position_ru="Заведующая отделением",
                    position_uz="Bo'lim mudirasi",
                    position_en="Head of Department",
                    credentials_ru="Кандидат медицинских наук, врач высшей категории",
                    credentials_uz="Tibbiyot fanlari nomzodi, oliy toifali shifokor",
                    credentials_en="Candidate of Medical Sciences, highest category physician",
                    order=1,
                    is_active=True
                ),
                CenterStaff(
                    center_id=centers_list[0].id,
                    last_name_ru="Тохиров",
                    last_name_uz="Tohirov",
                    last_name_en="Tokhirov",
                    first_name_ru="Бобур",
                    first_name_uz="Bobur",
                    first_name_en="Bobur",
                    patronymic_ru="Шавкатович",
                    patronymic_uz="Shavkatovich",
                    patronymic_en="Shavkatovich",
                    position_ru="Врач-ревматолог",
                    position_uz="Revmatolog shifokor",
                    position_en="Rheumatologist",
                    credentials_ru="Врач первой категории, специализация по биологической терапии",
                    credentials_uz="Birinchi toifali shifokor, biologik terapiya mutaxassisi",
                    credentials_en="First category physician, biological therapy specialist",
                    order=2,
                    is_active=True
                ),
                CenterStaff(
                    center_id=centers_list[0].id,
                    last_name_ru="Ахмедова",
                    last_name_uz="Axmedova",
                    last_name_en="Akhmedova",
                    first_name_ru="Зарина",
                    first_name_uz="Zarina",
                    first_name_en="Zarina",
                    patronymic_ru="Камоловна",
                    patronymic_uz="Kamolovna",
                    patronymic_en="Kamolovna",
                    position_ru="Врач-ревматолог",
                    position_uz="Revmatolog shifokor",
                    position_en="Rheumatologist",
                    credentials_ru="Врач второй категории",
                    credentials_uz="Ikkinchi toifali shifokor",
                    credentials_en="Second category physician",
                    order=3,
                    is_active=True
                ),
            ])
            # Staff for second center
            center_staff.extend([
                CenterStaff(
                    center_id=centers_list[1].id,
                    last_name_ru="Умаров",
                    last_name_uz="Umarov",
                    last_name_en="Umarov",
                    first_name_ru="Фаррух",
                    first_name_uz="Farrux",
                    first_name_en="Farrukh",
                    patronymic_ru="Алишерович",
                    patronymic_uz="Alisherovich",
                    patronymic_en="Alisherovich",
                    position_ru="Заведующий отделением ревматологии",
                    position_uz="Revmatologiya bo'limi mudiri",
                    position_en="Head of Rheumatology Department",
                    credentials_ru="Доктор медицинских наук, профессор",
                    credentials_uz="Tibbiyot fanlari doktori, professor",
                    credentials_en="Doctor of Medical Sciences, Professor",
                    order=1,
                    is_active=True
                ),
                CenterStaff(
                    center_id=centers_list[1].id,
                    last_name_ru="Саидова",
                    last_name_uz="Saidova",
                    last_name_en="Saidova",
                    first_name_ru="Нилуфар",
                    first_name_uz="Nilufar",
                    first_name_en="Nilufar",
                    patronymic_ru="Бахтиёровна",
                    patronymic_uz="Baxtiyorovna",
                    patronymic_en="Bakhtiyorovna",
                    position_ru="Врач-ревматолог",
                    position_uz="Revmatolog shifokor",
                    position_en="Rheumatologist",
                    credentials_ru="Кандидат медицинских наук",
                    credentials_uz="Tibbiyot fanlari nomzodi",
                    credentials_en="Candidate of Medical Sciences",
                    order=2,
                    is_active=True
                ),
            ])

        if center_staff:
            db.add_all(center_staff)
            await db.commit()
            print("+ Center staff added")

        print("\n=== Database seeded successfully! ===")


if __name__ == "__main__":
    asyncio.run(seed_database())
