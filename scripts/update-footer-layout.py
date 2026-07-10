#!/usr/bin/env python3
from pathlib import Path

OLD = '''      <div class="footer-info">
        <h3>Центр ментального здоровья Азимут Клиник.<br>Помощь доступна круглосуточно.</h3>
        <p>ООО "АЗИМУТ КЛИНИК"<br>ИНН 9728138650<br>КПП 772801001<br>ОГРН 1247700524576<br>Юридический адрес 117630, Город Москва, вн.тер. г. Муниципальный Округ Обручевский, ш.<br>Старокалужское, дом 62</p>
        <p>Налогообложение УСН, Без НДС<br>Расчетный счет / Номер счета 40702810038720049190<br>Банк ПАО Сбербанк БИК 044525225<br>Корр. счет 30101810400000000225</p>
        <p>Телефон:<br><a href="tel:+79251127799">8 (925) 112 77 99</a></p>
        <p>E-mail:<br><a href="mailto:info@azimutmedline.ru">info@azimutmedline.ru</a></p>
        <a href="https://azimutclinic.ru/">azimutclinic.ru</a>
      </div>'''

NEW = '''      <div class="footer-info">
        <div class="footer-info-head">
          <h3>Центр ментального здоровья Азимут Клиник</h3>
          <p class="footer-tagline">Помощь доступна круглосуточно.</p>
        </div>
        <div class="footer-contact">
          <a class="footer-contact-link" href="tel:+79251127799">8 (925) 112 77 99</a>
          <a class="footer-contact-link" href="mailto:info@azimutmedline.ru">info@azimutmedline.ru</a>
          <a class="footer-contact-link footer-site-link" href="https://azimutclinic.ru/">azimutclinic.ru</a>
        </div>
        <div class="footer-legal">
          <p>ООО "АЗИМУТ КЛИНИК"<br>ИНН 9728138650<br>КПП 772801001<br>ОГРН 1247700524576<br>Юридический адрес 117630, Город Москва, вн.тер. г. Муниципальный Округ Обручевский, ш.<br>Старокалужское, дом 62</p>
          <p>Налогообложение УСН, Без НДС<br>Расчетный счет / Номер счета 40702810038720049190<br>Банк ПАО Сбербанк БИК 044525225<br>Корр. счет 30101810400000000225</p>
        </div>
      </div>'''

root = Path(__file__).resolve().parents[1]
for html in root.glob("*.html"):
    text = html.read_text(encoding="utf-8")
    if OLD in text:
        html.write_text(text.replace(OLD, NEW), encoding="utf-8")
        print("updated", html.name)