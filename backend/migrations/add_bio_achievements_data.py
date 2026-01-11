"""
Скрипт для:
1. Добавления колонок achievements в таблицу chief_rheumatologists
2. Заполнения bio и achievements для существующих записей
"""
import asyncio
from sqlalchemy import text
from database.connection import engine


# Тестовые данные для главных ревматологов
DOCTORS_DATA = [
    {
        "region_ru": "Ташкентская область",
        "bio_ru": "Более 20 лет посвятил развитию ревматологической службы Ташкентской области. Под его руководством внедрены современные методы диагностики и лечения системных заболеваний соединительной ткани. Активно занимается научно-исследовательской работой в области ревматоидного артрита.",
        "bio_uz": "20 yildan ortiq vaqtini Toshkent viloyati revmatologiya xizmatini rivojlantirishga bag'ishladi. Uning rahbarligida biriktiruvchi to'qima tizimli kasalliklarini diagnostika qilish va davolashning zamonaviy usullari joriy etildi.",
        "bio_en": "Has dedicated over 20 years to developing the rheumatology service in Tashkent region. Under his leadership, modern methods of diagnosis and treatment of systemic connective tissue diseases have been implemented.",
        "achievements_ru": "Автор более 30 научных публикаций в области ревматологии. Награждён почётной грамотой Министерства здравоохранения Республики Узбекистан. Член Ассоциации ревматологов Узбекистана с 2005 года.",
        "achievements_uz": "Revmatologiya sohasida 30 dan ortiq ilmiy nashrlar muallifi. O'zbekiston Respublikasi Sog'liqni saqlash vazirligi faxriy yorlig'i bilan taqdirlangan.",
        "achievements_en": "Author of over 30 scientific publications in rheumatology. Awarded an honorary diploma from the Ministry of Health of Uzbekistan. Member of the Uzbekistan Rheumatology Association since 2005."
    },
    {
        "region_ru": "г. Ташкент",
        "bio_ru": "Ведущий специалист в области диагностики и лечения аутоиммунных заболеваний. Прошёл стажировку в ведущих клиниках Европы. Внедряет инновационные подходы к терапии системной красной волчанки и васкулитов.",
        "bio_uz": "Autoimmun kasalliklarni diagnostika qilish va davolash sohasining yetakchi mutaxassisi. Yevropaning yetakchi klinikalarida stajirovka o'tagan.",
        "bio_en": "Leading specialist in diagnosis and treatment of autoimmune diseases. Completed internships at leading European clinics. Implements innovative approaches to therapy of systemic lupus erythematosus and vasculitis.",
        "achievements_ru": "Доктор медицинских наук. Участник международных конференций по ревматологии (EULAR 2019, 2022). Руководитель городского центра биологической терапии.",
        "achievements_uz": "Tibbiyot fanlari doktori. Revmatologiya bo'yicha xalqaro konferensiyalar qatnashchisi (EULAR 2019, 2022).",
        "achievements_en": "Doctor of Medical Sciences. Participant of international rheumatology conferences (EULAR 2019, 2022). Head of the city biological therapy center."
    },
    {
        "region_ru": "Самаркандская область",
        "bio_ru": "Опытный клиницист с 15-летним стажем работы в ревматологии. Специализируется на лечении анкилозирующего спондилита и псориатического артрита. Активно развивает телемедицинские консультации для отдалённых районов области.",
        "bio_uz": "Revmatologiyada 15 yillik tajribaga ega tajribali klinitsist. Ankilozlovchi spondilit va psoriatik artritni davolashga ixtisoslashgan.",
        "bio_en": "Experienced clinician with 15 years of experience in rheumatology. Specializes in treatment of ankylosing spondylitis and psoriatic arthritis. Actively develops telemedicine consultations for remote areas.",
        "achievements_ru": "Кандидат медицинских наук. Автор методических рекомендаций по ранней диагностике спондилоартритов. Победитель конкурса «Лучший врач года» Самаркандской области (2021).",
        "achievements_uz": "Tibbiyot fanlari nomzodi. Spondiloartritlarni erta tashxislash bo'yicha uslubiy tavsiyalar muallifi.",
        "achievements_en": "Candidate of Medical Sciences. Author of methodological recommendations for early diagnosis of spondyloarthritis. Winner of 'Best Doctor of the Year' award in Samarkand region (2021)."
    },
    {
        "region_ru": "Ферганская область",
        "bio_ru": "Высококвалифицированный специалист, посвятивший карьеру развитию ревматологической помощи в Ферганской долине. Организовал школу для пациентов с ревматическими заболеваниями. Ведёт активную просветительскую деятельность.",
        "bio_uz": "Farg'ona vodiysida revmatologik yordam ko'rsatishni rivojlantirishga o'z faoliyatini bag'ishlagan yuqori malakali mutaxassis.",
        "bio_en": "Highly qualified specialist who has dedicated his career to developing rheumatological care in the Fergana Valley. Organized a school for patients with rheumatic diseases.",
        "achievements_ru": "Заслуженный врач Республики Узбекистан. Подготовил более 10 специалистов-ревматологов для региона. Инициатор создания регионального регистра пациентов с ревматоидным артритом.",
        "achievements_uz": "O'zbekiston Respublikasining xizmat ko'rsatgan shifokori. Mintaqa uchun 10 dan ortiq revmatolog mutaxassislarni tayyorladi.",
        "achievements_en": "Honored Doctor of the Republic of Uzbekistan. Trained more than 10 rheumatology specialists for the region. Initiator of creating a regional registry of patients with rheumatoid arthritis."
    },
    {
        "region_ru": "Бухарская область",
        "bio_ru": "Талантливый врач-ревматолог, сочетающий клиническую практику с научной деятельностью. Изучает особенности течения ревматических заболеваний в условиях жаркого климата. Внедрил программу ранней диагностики остеопороза.",
        "bio_uz": "Klinik amaliyotni ilmiy faoliyat bilan uyg'unlashtirgan iqtidorli revmatolog shifokor. Issiq iqlim sharoitida revmatik kasalliklarning kechish xususiyatlarini o'rganadi.",
        "bio_en": "Talented rheumatologist combining clinical practice with scientific activity. Studies the peculiarities of rheumatic diseases in hot climate conditions. Implemented an early osteoporosis diagnosis program.",
        "achievements_ru": "Лауреат премии «Молодой учёный» Академии наук Узбекистана. Автор 15 научных статей. Руководитель программы скрининга остеопороза в Бухарской области.",
        "achievements_uz": "O'zbekiston Fanlar akademiyasining 'Yosh olim' mukofoti laureati. 15 ta ilmiy maqola muallifi.",
        "achievements_en": "Laureate of the 'Young Scientist' award of the Academy of Sciences of Uzbekistan. Author of 15 scientific articles. Head of osteoporosis screening program in Bukhara region."
    }
]


async def run_migration():
    async with engine.begin() as conn:
        # 1. Добавляем колонки achievements (если их нет)
        print("Adding achievements columns...")
        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                              WHERE table_name='chief_rheumatologists' AND column_name='achievements_ru') THEN
                    ALTER TABLE chief_rheumatologists ADD COLUMN achievements_ru TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                              WHERE table_name='chief_rheumatologists' AND column_name='achievements_uz') THEN
                    ALTER TABLE chief_rheumatologists ADD COLUMN achievements_uz TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                              WHERE table_name='chief_rheumatologists' AND column_name='achievements_en') THEN
                    ALTER TABLE chief_rheumatologists ADD COLUMN achievements_en TEXT;
                END IF;
            END $$;
        """))
        print("Columns added successfully!")

        # 2. Получаем существующих докторов
        result = await conn.execute(text("SELECT id, region_ru FROM chief_rheumatologists ORDER BY \"order\", id"))
        doctors = result.fetchall()

        print(f"Found {len(doctors)} doctors in database")

        # 3. Обновляем каждого доктора
        for i, doctor in enumerate(doctors):
            doctor_id = doctor[0]
            # Используем данные циклически, если докторов больше чем данных
            data = DOCTORS_DATA[i % len(DOCTORS_DATA)]

            await conn.execute(text("""
                UPDATE chief_rheumatologists
                SET bio_ru = :bio_ru,
                    bio_uz = :bio_uz,
                    bio_en = :bio_en,
                    achievements_ru = :achievements_ru,
                    achievements_uz = :achievements_uz,
                    achievements_en = :achievements_en
                WHERE id = :id
            """), {
                "id": doctor_id,
                "bio_ru": data["bio_ru"],
                "bio_uz": data["bio_uz"],
                "bio_en": data["bio_en"],
                "achievements_ru": data["achievements_ru"],
                "achievements_uz": data["achievements_uz"],
                "achievements_en": data["achievements_en"]
            })
            print(f"Updated doctor ID {doctor_id}")

        print("\nMigration completed successfully!")
        print("Bio and achievements data has been added to all chief rheumatologists.")


if __name__ == "__main__":
    asyncio.run(run_migration())
