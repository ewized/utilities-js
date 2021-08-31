import { SerializeTypes, createUrl, url } from './url';


it('should create url bases', () => {
  const baseUrl = url`https://example.com/`;
  const myUrl = createUrl(baseUrl);

  expect(url`${baseUrl}/foo/bar`)
    .toStrictEqual(myUrl`/foo/bar`);
  expect(url`${baseUrl}foo/bar`)
    .toStrictEqual(myUrl`/foo/bar`);
});

it('should parse', () => {
  url`https://example.com/`; //?
  // @ts-ignore
  url`https://example.com/` == 'https://example.com/'; //? true
  // @ts-ignore
  url`https://example.com/` === 'https://example.com/'; //? false
  url`https://example.com/` == url`https://example.com/`; //? false
  url`https://example.com/` === url`https://example.com/`; //? false

  expect(String(url`https://example.com/`))
    .toBe(`${url`https://example.com/`}`);
  expect(url`https://example.com/`)
    .toBeInstanceOf(URL);
  expect(url`https://example.com/`.toString())
    .toBe('https://example.com/');
  expect(url`https://example.com/${'foo'}/bar?${{ foo: 'bar' }}`.toString())
    .toBe('https://example.com/foo/bar?foo=bar');
  expect(url`https://example.com/${'foo'}/bar#${{ foo: 'bar' }}`.toString())
    .toBe('https://example.com/foo/bar#foo=bar');
  expect(url`https://example.com/${'foo'}/bar#${[0, 0, 0]}`.toString())
    .toBe('https://example.com/foo/bar#0,0,0');

  const baseUrl = url`https://example.com/`;
  expect(url`${baseUrl}/foo/bar`.toString())
    .toBe('https://example.com/foo/bar');
  expect(url`${baseUrl}foo/bar`.toString())
    .toBe('https://example.com/foo/bar');
});

it('should advance parse', () => {
  const baseUrl = 'https://example.com';
  expect(url`https://example.com/${'foo'}/bar?${{ foo: 'bar' }}`.toString())
    .toBe('https://example.com/foo/bar?foo=bar');
  expect(url`${baseUrl}api?${['foo', 'bar']}`.toString())
    .toBe(`${baseUrl}/api?foo,bar`);
  expect(url`${baseUrl}api?${[null, 'bar']}`.toString())
    .toBe(`${baseUrl}/api?null,bar`);
  expect(url`${baseUrl}api?${[{ foo: 'bar' }, 'bar']}`.toString())
    .toBe(`${baseUrl}/api?{%22foo%22:%22bar%22},bar`);
  expect(url`${baseUrl}api?${[{ foo: [1, 2, 3] }, 'bar']}`.toString())
    .toBe(`${baseUrl}/api?{%22foo%22:[1,2,3]},bar`);
  expect(url`${baseUrl}api?${{ xyz: [1, 2, [0, 0]], foo: 'bar' }}`.toString())
    .toBe(`${baseUrl}/api?xyz=[1,2,[0,0]]&foo=bar`);
});

it('should all be either a string number boolean', () => {
  expect(typeof SerializeTypes.serialize()).toBe('string');
  expect(typeof SerializeTypes.serialize(null)).toBe('string');
  expect(typeof SerializeTypes.serialize(undefined)).toBe('string');
  expect(typeof SerializeTypes.serialize('string')).toBe('string');
  expect(typeof SerializeTypes.serialize(0)).toBe('number');
  expect(typeof SerializeTypes.serialize(1)).toBe('number');
  expect(typeof SerializeTypes.serialize(true)).toBe('boolean');
  expect(typeof SerializeTypes.serialize(false)).toBe('boolean');
});
