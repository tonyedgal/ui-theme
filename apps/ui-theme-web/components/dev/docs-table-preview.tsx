import { Prose, ScrollableTable } from '@/components/docs/prose';
import { componentApi } from '@/lib/component-guides';
import { componentBases, componentDocs } from '@/lib/component-docs';

const disclosure = componentDocs.find(
  (doc) => doc.name === 'theme-disclosure'
)!;

const demo = componentApi(disclosure, 'base-ui');

const allRows = componentBases.flatMap((base) =>
  componentDocs.flatMap((doc) => componentApi(doc, base.name))
);

const cases = ['demo', 'worst', 'empty', 'one', 'many'];

const worst = [
  ...demo.filter((row) =>
    [
      'animationType',
      'onOpenChange',
      'slideDirection',
      'display',
      'direction',
    ].includes(row.name)
  ),
  {
    ...demo[0]!,
    description:
      'See https://example.com/docs/frameworks/server-rendered-applications/accessibility-and-color-theme-preferences for the label requirements.',
  },
  {
    ...demo.find((row) => row.name === 'duration')!,
    description:
      'Thời gian chuyển giao diện được tính bằng mili giây. Giữ nguyên lựa chọn của người dùng khi nội dung thay đổi.',
  },
  {
    ...demo.find((row) => row.name === 'classes')!,
    description:
      'テーマの表示設定とアクセシビリティを保ちながら、トリガーとコンテンツのスタイルを変更します。',
  },
];

export function DocsTablePreview({
  data,
  largeText,
}: {
  data: string;
  largeText: boolean;
}) {
  const rows =
    data === 'empty'
      ? []
      : data === 'one'
        ? demo.slice(0, 1)
        : data === 'many'
          ? allRows
          : data === 'worst'
            ? worst
            : demo;

  const url = (next: string, enlarged = largeText) =>
    `?surface=tables&data=${next}${enlarged ? '&text=200' : ''}`;

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-3xl space-y-8 px-4 pt-8 pb-40 sm:px-8 xl:px-12"
    >
      {largeText && <style>{':root { font-size: 200%; }'}</style>}
      <h1 className="[overflow-wrap:anywhere] text-2xl font-semibold">
        Documentation table audit
      </h1>
      <p>
        {rows.length} {rows.length === 1 ? 'API row' : 'API rows'}. The table
        uses the same renderer and prose styles as the component guides.
      </p>
      <Prose>
        <h2>API reference</h2>
        <ScrollableTable className="min-w-[40rem]">
          <thead>
            <tr>
              <th>Prop</th>
              <th>Type</th>
              <th>Behavior</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.name}-${index}`}>
                <td>
                  <code>{row.name}</code>
                </td>
                <td>
                  <code>{row.type}</code>
                </td>
                <td>{row.description}</td>
              </tr>
            ))}
          </tbody>
        </ScrollableTable>
        <h2>Keyboard</h2>
        <ScrollableTable>
          <thead>
            <tr>
              <th>Key</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>Enter / Space</code>
              </td>
              <td>Expand or collapse the focused trigger.</td>
            </tr>
            <tr>
              <td>
                <code>Tab</code>
              </td>
              <td>
                Move from the trigger into the expanded panel and its radio
                choices.
              </td>
            </tr>
            <tr>
              <td>
                <code>Arrow keys</code>
              </td>
              <td>Change the selected radio within the group.</td>
            </tr>
            <tr>
              <td>
                <code>Space</code>
              </td>
              <td>Select the focused radio.</td>
            </tr>
          </tbody>
        </ScrollableTable>
      </Prose>
      <nav
        aria-label="Table fixture data"
        className="fixed bottom-3 left-1/2 z-80 flex w-max max-w-[calc(100%-1rem)] -translate-x-1/2 flex-wrap justify-center gap-1 rounded-lg border bg-muted p-1 font-sans text-[12px]"
      >
        {cases.map((name) => (
          <a
            key={name}
            href={url(name)}
            aria-current={data === name ? 'page' : undefined}
            className="rounded px-2 py-2 text-muted-foreground aria-[current=page]:bg-background aria-[current=page]:text-foreground"
          >
            {name === 'demo'
              ? 'Demo data'
              : name === 'worst'
                ? 'Worst case'
                : name === 'many'
                  ? 'All API rows'
                  : name}
          </a>
        ))}
        <a href={url(data, !largeText)} className="rounded px-2 py-2">
          {largeText ? '100% text' : '200% text'}
        </a>
      </nav>
    </main>
  );
}
