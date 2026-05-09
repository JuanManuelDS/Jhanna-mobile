import { render, fireEvent } from '@testing-library/react-native';
import EditableTimePickerCard from '../src/components/EditableTimePickerCard';

const baseProps = {
  label: 'Preparation',
  sublabel: 'Settle into stillness',
  min: 5,
  max: 600,
  step: 10,
  unit: 'sec',
  formatDisplay: (v) => String(v),
  formatEditing: (v) => String(v),
};

describe('EditableTimePickerCard', () => {
  it('renders label, sublabel, value, and unit', () => {
    const { getByText } = render(
      <EditableTimePickerCard {...baseProps} value={60} onChange={jest.fn()} />
    );
    expect(getByText('Preparation')).toBeTruthy();
    expect(getByText('Settle into stillness')).toBeTruthy();
    expect(getByText('60')).toBeTruthy();
    expect(getByText('sec')).toBeTruthy();
  });

  it('increments by step when + pressed', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <EditableTimePickerCard {...baseProps} value={60} onChange={onChange} />
    );
    fireEvent.press(getByLabelText('Increase Preparation'));
    expect(onChange).toHaveBeenCalledWith(70);
  });

  it('decrements by step when − pressed', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <EditableTimePickerCard {...baseProps} value={60} onChange={onChange} />
    );
    fireEvent.press(getByLabelText('Decrease Preparation'));
    expect(onChange).toHaveBeenCalledWith(50);
  });

  it('clamps to max when incrementing at the boundary', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <EditableTimePickerCard {...baseProps} value={600} onChange={onChange} />
    );
    fireEvent.press(getByLabelText('Increase Preparation'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clamps to min when decrementing at the boundary', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <EditableTimePickerCard {...baseProps} value={5} onChange={onChange} />
    );
    fireEvent.press(getByLabelText('Decrease Preparation'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('opens text input on tap and commits a typed value', () => {
    const onChange = jest.fn();
    const { getByLabelText, getByDisplayValue } = render(
      <EditableTimePickerCard {...baseProps} value={60} onChange={onChange} />
    );
    fireEvent.press(getByLabelText('Edit Preparation'));
    const input = getByDisplayValue('');
    fireEvent.changeText(input, '120');
    fireEvent(input, 'submitEditing');
    expect(onChange).toHaveBeenCalledWith(120);
  });

  it('clamps absurd input to max', () => {
    const onChange = jest.fn();
    const { getByLabelText, getByDisplayValue } = render(
      <EditableTimePickerCard {...baseProps} value={60} onChange={onChange} />
    );
    fireEvent.press(getByLabelText('Edit Preparation'));
    const input = getByDisplayValue('');
    fireEvent.changeText(input, '999999');
    fireEvent(input, 'blur');
    expect(onChange).toHaveBeenCalledWith(600);
  });

  it('clamps below-min input to min', () => {
    const onChange = jest.fn();
    const { getByLabelText, getByDisplayValue } = render(
      <EditableTimePickerCard {...baseProps} value={60} onChange={onChange} />
    );
    fireEvent.press(getByLabelText('Edit Preparation'));
    const input = getByDisplayValue('');
    fireEvent.changeText(input, '0');
    fireEvent(input, 'blur');
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('strips non-numeric characters from typed input', () => {
    const onChange = jest.fn();
    const { getByLabelText, getByDisplayValue } = render(
      <EditableTimePickerCard {...baseProps} value={60} onChange={onChange} />
    );
    fireEvent.press(getByLabelText('Edit Preparation'));
    const input = getByDisplayValue('');
    fireEvent.changeText(input, 'abc12def3');
    fireEvent(input, 'blur');
    expect(onChange).toHaveBeenCalledWith(123);
  });

  it('empty input does not call onChange', () => {
    const onChange = jest.fn();
    const { getByLabelText, getByDisplayValue } = render(
      <EditableTimePickerCard {...baseProps} value={60} onChange={onChange} />
    );
    fireEvent.press(getByLabelText('Edit Preparation'));
    const input = getByDisplayValue('');
    fireEvent.changeText(input, '');
    fireEvent(input, 'blur');
    expect(onChange).not.toHaveBeenCalled();
  });
});
