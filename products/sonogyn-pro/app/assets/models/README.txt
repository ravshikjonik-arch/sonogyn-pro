Положите сюда файл uterus.glb и подключите его для Metro:

1. Натив: в src/gynecology/uterus3d/uterusGlbModule.ts замените null на
   export const UTERUS_GLB_MODULE = require("../../assets/models/uterus.glb");

2. Имена мешей в GLB желательно содержать подстроки: cervix, endometrium, junctional или JZ, myometrium, subserosa, serosa (см. glbLayerMap.ts).
