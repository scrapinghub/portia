import { findReleatedTableCell, suggestAnnotations } from '../../../utils/suggest-annotations';
import { module, test } from 'qunit';

module('Unit | Utility | Suggest Annotations');

// Replace this with your real tests.
test('findReleatedTableCell', function(assert) {
    let table = $(`
        <table>
          <tr>
              <td id="brand">Brand</td>
              <td>Intel</td>
          </tr>
          <tr>
              <td id="series">Series</td>
              <td>Core i5</td>
          </tr>
          <tr>
              <td id="cores">Cores</td>
              <td>4</td>
          </tr>
        </table>
    `);

    assert.equal(findReleatedTableCell(table.find('#brand')[0]).firstChild.nodeValue, 'Intel');
    assert.equal(findReleatedTableCell(table.find('#series')[0]).firstChild.nodeValue, 'Core i5');
    assert.equal(findReleatedTableCell(table.find('#cores')[0]).firstChild.nodeValue, '4');

    table = $(`
        <table>
          <tr>
              <td id="brand">Brand</td>
              <td id="series">Series</td>
              <td id="cores">Cores</td>
          </tr>
          <tr>
              <td>Intel</td>
              <td>Core i5</td>
              <td>4</td>
          </tr>
        </table>
    `);
    assert.equal(findReleatedTableCell(table.find('#brand')[0]).firstChild.nodeValue, 'Intel');
    assert.equal(findReleatedTableCell(table.find('#series')[0]).firstChild.nodeValue, 'Core i5');
    assert.equal(findReleatedTableCell(table.find('#cores')[0]).firstChild.nodeValue, '4');

    table = $(`
        <table>
          <tr>
              <th id="brand">Brand</th>
              <th id="series">Series</th>
              <th id="cores">Cores</th>
          </tr>
          <tr>
              <td>Intel</td>
              <td>Core i5</td>
              <td>4</td>
          </tr>
        </table>
    `);
    assert.equal(findReleatedTableCell(table.find('#brand')[0]).firstChild.nodeValue, 'Intel');
    assert.equal(findReleatedTableCell(table.find('#series')[0]).firstChild.nodeValue, 'Core i5');
    assert.equal(findReleatedTableCell(table.find('#cores')[0]).firstChild.nodeValue, '4');

    table = $(`
        <table>
          <thead>
            <tr>
                <td id="brand">Brand</td>
                <td id="series">Series</td>
                <td id="cores">Cores</td>
            </tr>
          </thead>
          <tr>
              <td>Intel</td>
              <td>Core i5</td>
              <td>4</td>
          </tr>
        </table>
    `);
    assert.equal(findReleatedTableCell(table.find('#brand')[0]).firstChild.nodeValue, 'Intel');
    assert.equal(findReleatedTableCell(table.find('#series')[0]).firstChild.nodeValue, 'Core i5');
    assert.equal(findReleatedTableCell(table.find('#cores')[0]).firstChild.nodeValue, '4');


    table = $(`
        <table>
          <thead>
            <tr>
                <td id="brand">Brand</td>
                <td id="series">Series</td>
                <td id="cores">Cores</td>
            </tr>
          </thead>
          <tbody>
            <tr>
                <td>Intel</td>
                <td>Core i5</td>
                <td>4</td>
            </tr>
          </tbody>
        </table>
    `);
    assert.equal(findReleatedTableCell(table.find('#brand')[0]).firstChild.nodeValue, 'Intel');
    assert.equal(findReleatedTableCell(table.find('#series')[0]).firstChild.nodeValue, 'Core i5');
    assert.equal(findReleatedTableCell(table.find('#cores')[0]).firstChild.nodeValue, '4');

    table = $(`
        <table>
          <thead>
            <tr>
                <td colspan="2">Model</td>
                <td id="cores">Cores</td>
            </tr>
          </thead>
          <tbody>
            <tr>
                <td>Intel</td>
                <td>Core i5</td>
                <td>4</td>
            </tr>
          </tbody>
        </table>
    `);
    assert.equal(findReleatedTableCell(table.find('#cores')[0]).firstChild.nodeValue, '4');
    table = $(`
        <table>
          <thead>
            <tr>
                <td id="brand">Brand</td>
                <td id="series">Series</td>
                <td id="cores">Cores</td>
            </tr>
          </thead>
          <tbody>
            <tr>
                <td colspan="2">Intel Core I5</td>
                <td>4</td>
            </tr>
          </tbody>
        </table>
    `);
    assert.equal(findReleatedTableCell(table.find('#cores')[0]).firstChild.nodeValue, '4');
});

function sum(numbers) {
    return numbers.reduce((a,b) => a+b, 0);
}

function nodeArea(node) {
    return sum(
        Array.from(node.getClientRects())
             .map(rect => rect.width*rect.height)
    );
}

function testSuggester(assert, fragment, field, expectedSuggestion, expectedSuggestor) {
    var doc = document.implementation.createHTMLDocument('test');
    doc.body.innerHTML = fragment;
    var done = assert.async();

    //assert.equal(doc.documentElement.outerHTML, '');

    suggestAnnotations(doc, [field], function(suggestions){
        assert.equal(suggestions.length, 1);
        let [sfield, node, attr, suggestor] = suggestions[0];

        assert.equal(sfield, field);
        var value = attr === 'content' ? node.textContent : node.getAttribute(attr);
        assert.equal(value, expectedSuggestion);
        assert.equal(suggestor, expectedSuggestor);

        done();
    });

}

test('suggestAnnotations', function(assert) {
    var test = testSuggester.bind(null, assert);

    var img = "http://google.com/favicon.ico";

    // Title suggester
    //test('', 'title', 'test', 'title');

    // Microdata
    test(`<img itemprop="qwerty" src="${img}"/>`, 'qwerty', img, 'microdata');
    test(`<img itemprop="qwerty" src="${img}"/>`, 'qwertyvalue', img, 'microdata');
    test(`<p itemprop="qwerty">hihi</p>`, 'qwertyfoobar', 'hihi', 'microdata');

    // Link
    test(`<a href="hihi">next</a>`, 'next_url', 'hihi', 'links');
    test(`<a href="hihi">Next Page →</a>`, 'next_url', 'hihi', 'links');
    test(`<a href="hihi">Next Page →</a>`, 'next_page_url', 'hihi', 'links');

    // Table
    let table = `
    <table>
      <tr>
          <td>Brand</td>
          <td>Intel</td>
      </tr>
      <tr>
          <td>Series</td>
          <td>Core i5</td>
      </tr>
      <tr>
          <td>Cores</td>
          <td>4</td>
      </tr>
    </table>`;
    test(table, 'series', 'Core i5', 'table');
    test(table, 'brand', 'Intel', 'table');
    test(table, 'cores', '4', 'table');

    table = `
        <table>
          <tr>
              <td>Brand</td>
              <td>Series</td>
              <td>Cores</td>
          </tr>
          <tr>
              <td>Intel</td>
              <td>Core i5</td>
              <td>4</td>
          </tr>
        </table>
    `;
    test(table, 'brand', 'Intel', 'table');
    test(table, 'series', 'Core i5', 'table');
    test(table, 'cores', '4', 'table');

    // id class
    test('<div id="fubar">hihi</div>', 'fubar', 'hihi', 'id_class');
    test('<div class="fubar">hihi</div>', 'fubar', 'hihi', 'id_class');
    test('<div class="fubar">hihi</div><span id="fubar">haha</span>', 'fubar', 'haha', 'id_class');


    // dt dd
    test('<dt>Fubar</dt><dd>hihi</dd>', 'fubar', 'hihi', 'dt_dd');


    // text_content
    test('<div>€55</div>', 'price', '€55', 'text_content');
    test('<div>50%</div>', 'percent', '50%', 'text_content');
    test('<div>24/12/1991</div>', 'date', '24/12/1991', 'text_content');

    test('<div><strong>SKU:</strong> 12345</div>', 'sku', 'SKU: 12345', 'text_content');
    test('<div>SKU: 12345</div>', 'sku', 'SKU: 12345', 'text_content');
    test('<div><span>SKU:</span>     <span>12345</span></div>', 'sku', '12345', 'text_content');
});
