#!/usr/bin/env python3
"""Генерация доклада о дендрарии Сочи для 4 класса (.docx)."""

from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.shared import Cm, Pt

OUT = Path.home() / "Desktop" / "Доклад_Дендрарий_Сочи_4класс.docx"


def set_normal_style(doc: Document) -> None:
    style = doc.styles["Normal"]
    font = style.font
    font.name = "Times New Roman"
    font.size = Pt(14)
    pf = style.paragraph_format
    pf.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    pf.space_after = Pt(0)
    pf.first_line_indent = Cm(1.25)


def add_heading_center(doc: Document, text: str, size: int = 16) -> None:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(text)
    run.bold = True
    run.font.name = "Times New Roman"
    run.font.size = Pt(size)


def add_section_title(doc: Document, text: str) -> None:
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Cm(0)
    run = p.add_run(text)
    run.bold = True
    run.font.name = "Times New Roman"
    run.font.size = Pt(14)


def add_body(doc: Document, text: str) -> None:
    p = doc.add_paragraph(text)
    for run in p.runs:
        run.font.name = "Times New Roman"
        run.font.size = Pt(14)


def main() -> None:
    doc = Document()
    for section in doc.sections:
        section.top_margin = Cm(2)
        section.bottom_margin = Cm(2)
        section.left_margin = Cm(3)
        section.right_margin = Cm(1.5)

    set_normal_style(doc)

    add_heading_center(doc, "ДОКЛАД", 16)
    add_heading_center(doc, "«Дендрарий — парк растений города Сочи»", 14)
    doc.add_paragraph()

    # титульный блок
    for line in [
        "Выполнил(а): ученик(ца) 4 «___» класса",
        "Ф.И.О. _________________________________",
        "Школа: _________________________________",
        "Учитель: ______________________________",
        "Сочи, 2026 г.",
    ]:
        p = doc.add_paragraph(line)
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p.paragraph_format.first_line_indent = Cm(0)
        for run in p.runs:
            run.font.name = "Times New Roman"
            run.font.size = Pt(14)

    doc.add_page_break()

    add_body(
        doc,
        "Сочи славится морем, горами и зеленью. Одно из самых красивых и познавательных мест — "
        "Дендрарий. Это большой парк, где собраны тысячи видов деревьев, кустарников и цветов со "
        "всего мира. Название «дендрарий» пришло от греческого слова dendron — дерево. Значит, "
        "главное богатство парка — растения.",
    )

    add_section_title(doc, "Где находится Дендрарий")
    add_body(
        doc,
        "Дендрарий расположен в микрорайоне Хоста, на склоне горы Лысая. Парк делится на нижнюю "
        "и верхнюю части. Между ними ходит канатная дорога — от неё открывается чудесный вид "
        "на море и город. Доехать до парка можно на автобусе или машине. Дендрарий входит в "
        "Сочинский национальный парк.",
    )

    add_section_title(doc, "История создания")
    add_body(
        doc,
        "Основал парк Сергей Николаевич Худеков (1837–1928). Он был писателем, журналистом и "
        "любителем природы. В 1889 году Худеков купил землю у посёлка Даховский и начал "
        "высаживать редкие растения. Саженцы он привозил из Франции и Италии. Основные "
        "посадки закончили в 1892 году — эту дату считают годом основания дендропарка. "
        "На территории построили виллу «Надежда» в честь жены Сергея Николаевича. "
        "Сегодня в ней музей: там можно узнать, как создавался парк.",
    )

    add_section_title(doc, "Что интересного в парке")
    add_body(
        doc,
        "В Дендрарии растут магнолии, кипарисы, пальмы, бамбук, камелии и многие другие "
        "деревья и кустарники. Некоторым растениям больше ста пятидесяти лет! Парк "
        "расположен террасами — как ступеньками на горе. Есть фонтаны, скульптуры, "
        "беседки и аллеи. В парке живут павлины, страусы, лебеди, утки и другие птицы. "
        "Детям нравятся экскурсии и прогулки: гид рассказывает о растениях простыми "
        "словами. Летом здесь проходят праздники и познавательные мероприятия для семей.",
    )

    add_section_title(doc, "Почему Дендрарий важен")
    add_body(
        doc,
        "Дендрарий — не только место отдыха, но и живая учебная книга по ботанике. "
        "Здесь сохраняют редкие растения и учат беречь природу. Именно из этого парка "
        "началось украшение Сочи субтропическими деревьями, которые мы видим на улицах города. "
        "Посещение Дендрария помогает понять, как человек может заботиться о Земле и "
        "создавать красивые сады для людей.",
    )

    add_section_title(doc, "Заключение")
    add_body(
        doc,
        "Я считаю, что Дендрарий — одно из лучших мест Сочи для семейного отдыха и "
        "обучения. Там можно гулять на свежем воздухе, любоваться цветами, узнавать "
        "новое о растениях и истории города. Каждому школьнику стоит хотя бы раз "
        "побывать в этом удивительном парке.",
    )

    doc.add_paragraph()
    add_section_title(doc, "Источники информации:")
    sources = [
        "Сайт Сочинского национального парка — npsochi.ru",
        "Официальный сайт парка Дендрарий — dendrarium.ru",
        "Энциклопедия и школьные материалы по природе Краснодарского края",
    ]
    for s in sources:
        p = doc.add_paragraph(s, style="List Bullet")
        p.paragraph_format.first_line_indent = Cm(0)
        for run in p.runs:
            run.font.name = "Times New Roman"
            run.font.size = Pt(14)

    doc.add_paragraph()
    p = doc.add_paragraph("Примечание: вставьте 2–3 фотографии парка на титульный лист или в конец доклада.")
    p.paragraph_format.first_line_indent = Cm(0)
    for run in p.runs:
        run.italic = True
        run.font.name = "Times New Roman"
        run.font.size = Pt(12)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUT)
    print(str(OUT))


if __name__ == "__main__":
    main()