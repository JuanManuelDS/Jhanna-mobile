import { render, fireEvent } from '@testing-library/react-native';
import BellSelect from '../src/components/BellSelect';
import { BELL_NAMES, NONE_BELL } from '../src/utils/bells';

jest.mock('../src/hooks/useBells', () => ({
  playBellPreview: jest.fn(),
  stopBellPreview: jest.fn(),
}));

const { playBellPreview, stopBellPreview } = require('../src/hooks/useBells');

describe('BellSelect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the label and current value', () => {
    const { getByText, getByLabelText } = render(
      <BellSelect label="Beginning bell" value="Aguda" onChange={jest.fn()} />
    );
    expect(getByText('Beginning bell')).toBeTruthy();
    expect(getByLabelText('Beginning bell: Aguda')).toBeTruthy();
  });

  it('opens a modal listing all bell options including None', () => {
    const { getByLabelText, getAllByLabelText } = render(
      <BellSelect label="Beginning bell" value="Aguda" onChange={jest.fn()} />
    );
    fireEvent.press(getByLabelText('Beginning bell: Aguda'));

    for (const name of BELL_NAMES) {
      // The "Aguda" label can collide with the trigger's accessibility label,
      // so use getAllByLabelText.
      expect(getAllByLabelText(name).length).toBeGreaterThan(0);
    }
    expect(getAllByLabelText(NONE_BELL).length).toBeGreaterThan(0);
  });

  it('tapping a row previews the bell but does not commit the selection', () => {
    const onChange = jest.fn();
    const { getByLabelText, getAllByLabelText } = render(
      <BellSelect label="Beginning bell" value="Aguda" onChange={onChange} />
    );
    fireEvent.press(getByLabelText('Beginning bell: Aguda'));
    const options = getAllByLabelText('Grave');
    fireEvent.press(options[options.length - 1]);

    expect(playBellPreview).toHaveBeenCalledWith('Grave');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('tapping a different row plays the new preview (previous is stopped inside playBellPreview)', () => {
    const { getByLabelText, getAllByLabelText } = render(
      <BellSelect label="Beginning bell" value="Aguda" onChange={jest.fn()} />
    );
    fireEvent.press(getByLabelText('Beginning bell: Aguda'));

    const grave = getAllByLabelText('Grave');
    fireEvent.press(grave[grave.length - 1]);
    const media = getAllByLabelText('Media');
    fireEvent.press(media[media.length - 1]);

    expect(playBellPreview).toHaveBeenNthCalledWith(1, 'Grave');
    expect(playBellPreview).toHaveBeenNthCalledWith(2, 'Media');
  });

  it('Save commits the pending selection and stops the preview', () => {
    const onChange = jest.fn();
    const { getByLabelText, getAllByLabelText } = render(
      <BellSelect label="Beginning bell" value="Aguda" onChange={onChange} />
    );
    fireEvent.press(getByLabelText('Beginning bell: Aguda'));
    const options = getAllByLabelText('Grave');
    fireEvent.press(options[options.length - 1]);

    fireEvent.press(getByLabelText('Save'));

    expect(onChange).toHaveBeenCalledWith('Grave');
    expect(stopBellPreview).toHaveBeenCalled();
  });

  it('Cancel discards the pending selection and stops the preview', () => {
    const onChange = jest.fn();
    const { getByLabelText, getAllByLabelText } = render(
      <BellSelect label="Beginning bell" value="Aguda" onChange={onChange} />
    );
    fireEvent.press(getByLabelText('Beginning bell: Aguda'));
    const options = getAllByLabelText('Grave');
    fireEvent.press(options[options.length - 1]);

    fireEvent.press(getByLabelText('Cancel'));

    expect(onChange).not.toHaveBeenCalled();
    expect(stopBellPreview).toHaveBeenCalled();
  });

  it('backdrop tap behaves like Cancel', () => {
    const onChange = jest.fn();
    const { getByLabelText, getByTestId, getAllByLabelText } = render(
      <BellSelect label="Beginning bell" value="Aguda" onChange={onChange} />
    );
    fireEvent.press(getByLabelText('Beginning bell: Aguda'));
    const options = getAllByLabelText('Grave');
    fireEvent.press(options[options.length - 1]);

    fireEvent.press(getByTestId('bell-select-backdrop'));

    expect(onChange).not.toHaveBeenCalled();
    expect(stopBellPreview).toHaveBeenCalled();
  });

  it('selecting None and saving commits None', () => {
    const onChange = jest.fn();
    const { getByLabelText, getAllByLabelText } = render(
      <BellSelect label="Beginning bell" value="Aguda" onChange={onChange} />
    );
    fireEvent.press(getByLabelText('Beginning bell: Aguda'));
    const options = getAllByLabelText(NONE_BELL);
    fireEvent.press(options[options.length - 1]);
    fireEvent.press(getByLabelText('Save'));

    expect(onChange).toHaveBeenCalledWith(NONE_BELL);
  });
});
