import { useMConfig } from '../../composables/useConfig';

const english: Readonly<Record<string, string>> = {
  'field.required': 'Choose or enter a value.',
  'cascader.invalid': 'A selected path is invalid or unavailable.', 'cascader.placeholder': 'Choose a path',
  'tree.invalid': 'A selected node is invalid or disabled.', 'tree.placeholder': 'Choose a node', 'tree.expand': 'Expand ', 'tree.collapse': 'Collapse ',
  'color.choose': 'Choose color', 'color.hexInvalid': 'Enter a valid HEX color.', 'color.hue': 'Hue', 'color.saturation': 'Saturation', 'color.brightness': 'Brightness', 'color.alpha': 'Opacity', 'color.presets': 'Color presets',
  'rate.invalid': 'The rating or range does not match the step.',
  'transfer.source': 'Available items', 'transfer.target': 'Selected items', 'transfer.selectAll': 'Select current results', 'transfer.add': 'Move to selected', 'transfer.remove': 'Move to available', 'transfer.invalid': 'The selection contains an invalid item.',
  'otp.incomplete': 'Enter the complete verification code.',
  'tag.duplicate': 'Tags cannot be repeated.', 'tag.max': 'The tag limit has been reached.', 'tag.remove': 'Remove tag ', 'tag.add': 'Add',
  'mention.suggestions': 'Mention suggestions',
  'date.rangeConfig': 'The date range configuration is invalid.', 'date.rangeIncomplete': 'Enter valid start and end dates.', 'date.rangeOrder': 'The start date must not follow the end date.', 'date.rangeBounds': 'The date range is outside the available bounds.', 'date.start': 'Start date', 'date.end': 'End date',
  'date.date': 'Date', 'date.time': 'Time', 'date.timeConfig': 'The date and time bounds are invalid.', 'date.timeIncomplete': 'Enter a complete valid date and time.', 'date.timeBounds': 'The date and time are outside the available bounds.',
  'date.invalid': 'The model contains an invalid date.', 'date.unavailable': 'This date is unavailable.', 'date.year': 'Calendar year', 'date.month': 'Calendar month',
  'time.config': 'The time range or step is invalid.', 'time.invalid': 'Enter a valid time as HH:mm or HH:mm:ss.', 'time.bounds': 'The time is outside the available bounds.', 'time.step': 'The time does not match the step.', 'time.confirm': 'Confirm the time input.', 'time.choose': 'Choose ', 'time.panel': ' time panel', 'time.hour': 'h', 'time.minute': 'm', 'time.second': 's', 'time.placeholder': 'Choose a time', 'time.unavailable': 'unavailable',
};

/** Subtree messages override these domain defaults, just as they override core messages. */
export function useReferenceConfig() {
  const { config, t: core } = useMConfig();
  return { config, t: (key: string, fallback: string) => core(key, config.value.locale?.startsWith('en') ? english[key] ?? fallback : fallback) };
}
