# Блог SEO (промпт 09)

Каркас `/blog`. Посадочные калькуляторы (10 шт.) и хаб — PR #79. Статьи — `apps/web/lib/seo/blog-posts.ts`.

## Готовые страницы (13)

| URL | Тип | Источники | Ревью |
|---|---|---|---|
| `/blog` | хаб | — | — |
| `/blog/orads-adnexa-2-minutes` | how-to | ACR O-RADS US | Якубов Р.В. |
| `/blog/iota-adnex-vs-orads` | guideline | IOTA + ACR | Якубов Р.В. |
| `/blog/endometrium-thickness-phases` | how-to | ISUOG + КР МЗ РФ | Якубов Р.В. |
| `/blog/bishop-when-to-score` | how-to | Bishop 1964 + КР | Якубов Р.В. |
| `/blog/vbac-before-you-calculate` | how-to | КР + ACOG | Якубов Р.В. |
| `/blog/efw-hadlock-limits` | guideline | ISUOG | Якубов Р.В. |
| `/blog/tirads-lexicon-3-minutes` | how-to | ACR TI-RADS | Якубов Р.В. |
| `/blog/birads-us-vs-mammography` | guideline | ACR BI-RADS US | Якубов Р.В. |
| `/blog/popq-measurement-points` | how-to | ICS/IUGA | Якубов Р.В. |
| `/blog/cervical-length-isuog-context` | guideline | ISUOG + КР | Якубов Р.В. |
| `/blog/figo-myoma-types-map` | how-to | FIGO + КР | Якубов Р.В. |
| `/blog/omt-ultrasound-checklist` | how-to | чек-листы + ISUOG | Якубов Р.В. |
| `/blog/orads-0-incomplete` | case | ACR O-RADS | Якубов Р.В. |

Числовые cut-off в статьях **не** публикуются — отсылка к калькулятору и гайдлайну.

## Следующая очередь (черновик)

1. FMF / I триместр — что не путать с скринингом  
2. Elastography: когда модуль уместен  
3. Colposcopy protocol — поля без диагноза  
4. LN-RADS: lexicon лимфоузлов  
5. Pregnancy medications — только справочная рамка  
6. ADNEX поля: что собрать до модели  
7. Open access кабинет vs регистрация  
8. PWA: что доступно offline  
9. Самопроверка / quiz — дисклеймер экзамена  
10. Career ladder: студент → врач в продукте  

Sitemap подхватывает slug автоматически через `listBlogPosts()`.
