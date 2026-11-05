export const records = Array.from({ length: 10_000 }, (_, index) => ({ id: `record-${index}`, name: `卷宗 ${String(index + 1).padStart(5, '0')}`, score: index + 1, group: index % 2 ? '青玉' : '朱砂' }));
export const options = records.map(record => ({ value: record.id, label: record.name, disabled: record.id === 'record-1' }));
export const columns = [{ key: 'name', label: '卷宗名称', sortable: true }, { key: 'score', label: '序号', sortable: true }, { key: 'group', label: '印色', filterOptions: [{ label: '朱砂', value: '朱砂' }, { label: '青玉', value: '青玉' }] }];
