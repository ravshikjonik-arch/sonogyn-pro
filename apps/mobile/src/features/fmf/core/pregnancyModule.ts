export const pregnancyUltrasoundModule = {
  module: "pregnancy_ultrasound",
  title: "Беременность",
  sections: [
    {
      id: "trimester_1_early",
      title: "Малый срок",
      weeks_range: "3-11",
      blocks: [
        {
          id: "general",
          fields: [
            { id: "lmp", type: "date", label: "Дата последней менструации" },
            { id: "beta_hcg", type: "number", label: "β-ХГЧ (опц.)" },
          ],
        },
        {
          id: "uterus",
          fields: [
            { id: "gestational_sac", type: "boolean" },
            { id: "sac_size", type: "number" },
            { id: "embryo", type: "boolean" },
            { id: "crl", type: "number" },
            { id: "fhr", type: "number" },
          ],
        },
        {
          id: "ovaries",
          fields: [
            { id: "corpus_luteum", type: "boolean" },
            { id: "cl_size", type: "number" },
            { id: "side", type: "select", options: ["право", "лево"] },
          ],
        },
      ],
      logic: {
        dating: "if crl -> use CRL else use LMP",
      },
      report_template:
        "Маточная беременность. Срок по КТР: {{weeks}} недель {{days}} дней. ЧСС {{fhr}} уд/мин.",
    },
    {
      id: "trimester_2_3",
      title: "II–III триместр",
      blocks: [
        {
          id: "fetometry",
          fields: [
            { id: "bpd", type: "number" },
            { id: "ofd", type: "number" },
            { id: "hc", type: "number" },
            { id: "ac", type: "number" },
            { id: "fl", type: "number" },
          ],
        },
        {
          id: "heart",
          fields: [
            { id: "fhr", type: "number" },
            { id: "rhythm", type: "select", options: ["норма", "аритмия"] },
          ],
        },
        {
          id: "brain",
          fields: [
            { id: "ventricles", type: "number" },
            { id: "cerebellum", type: "number" },
            { id: "cisterna_magna", type: "number" },
          ],
        },
        {
          id: "placenta",
          fields: [
            { id: "location", type: "select", options: ["передняя", "задняя", "дно"] },
            { id: "distance_os", type: "number" },
          ],
        },
      ],
      report_template: "Беременность {{weeks}} недель. Фетометрия соответствует сроку. Пороки не выявлены.",
    },
    {
      id: "doppler",
      title: "Допплер",
      blocks: [
        {
          id: "uterine",
          fields: [
            { id: "pi_right", type: "number" },
            { id: "pi_left", type: "number" },
          ],
        },
        {
          id: "umbilical",
          fields: [{ id: "pi_umb", type: "number" }],
        },
        {
          id: "mca",
          fields: [{ id: "pi_mca", type: "number" }],
        },
      ],
    },
    {
      id: "cervix",
      title: "Шейка матки",
      blocks: [
        {
          fields: [
            { id: "length", type: "number" },
            { id: "funneling", type: "boolean" },
          ],
        },
      ],
    },
    {
      id: "uterine_scar",
      title: "Рубец на матке",
      blocks: [
        {
          fields: [
            { id: "thickness", type: "number" },
            { id: "structure", type: "select", options: ["однородный", "неоднородный"] },
          ],
        },
      ],
    },
  ],
} as const;

export type PregnancySectionId = (typeof pregnancyUltrasoundModule.sections)[number]["id"];
