// node --test client/src/utils/region.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { countryFrom, currencyFor, languageFor } from "./region.js";

const ALL = ["en", "es", "fr", "de", "zh", "ja", "ru", "pt", "it", "ko", "tr", "nl", "id", "vi"];

test("the country comes from the time zone first (devices often say en-US anywhere), then the language regions", () => {
  assert.equal(countryFrom("Europe/Dublin", ["en-US"]), "IE");
  assert.equal(countryFrom("Europe/London", ["en-US"]), "GB");
  assert.equal(countryFrom("America/Chicago", ["en"]), "US");
  assert.equal(countryFrom("America/Indiana/Indianapolis", []), "US");
  assert.equal(countryFrom("Australia/Sydney", []), "AU");
  assert.equal(countryFrom("Etc/UTC", ["de-AT", "de"]), "AT");
  assert.equal(countryFrom("", ["fr"]), null);
});

test("the currency is the country's, and follows the language when it is not spoken there", () => {
  assert.equal(currencyFor("IE", "en"), "EUR");
  assert.equal(currencyFor("GB", "en"), "GBP");
  assert.equal(currencyFor("US", "en"), "USD");
  assert.equal(currencyFor("US", "es"), "USD", "Spanish is spoken in the US");
  assert.equal(currencyFor("DE", "en"), "EUR", "English keeps the country's money");
  assert.equal(currencyFor("IE", "ja"), "JPY", "switching to Japanese gives yen");
  assert.equal(currencyFor("GB", "de"), "EUR", "German in the UK: the language's home currency");
  assert.equal(currencyFor("CH", "fr"), "CHF");
  assert.equal(currencyFor("BR", "pt"), "BRL");
  assert.equal(currencyFor(null, "en"), "EUR");
  assert.equal(currencyFor(null, "ko"), "KRW");
});

test("first-visit language: the browser's if spoken in the country, else the country's own", () => {
  assert.equal(languageFor("IE", ["en-US"], ALL), "en");
  assert.equal(languageFor("DE", ["en-US"], ALL), "de");
  assert.equal(languageFor("CH", ["fr-CH", "en"], ALL), "fr");
  assert.equal(languageFor("US", ["es-US", "en"], ALL), "es");
  assert.equal(languageFor(null, ["pt-BR"], ALL), "pt");
  assert.equal(languageFor("FI", ["fi"], ALL), null, "nothing to offer: the next detector decides");
});
