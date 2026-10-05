import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme';
import { Button } from '../Button';

/** Every component test checks render, role, name and state (APP.md §9). */
const renderInTheme = (ui: React.ReactElement) => render(<ThemeProvider colorScheme="light">{ui}</ThemeProvider>);

describe('Button', () => {
  it('has the button role and its label as the name', () => {
    renderInTheme(<Button label="Save changes" />);
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeTruthy();
  });

  it('names an icon-only button from its label', () => {
    renderInTheme(<Button iconOnly leadingIcon="general/plus" label="Add item" />);
    expect(screen.getByRole('button', { name: 'Add item' })).toBeTruthy();
  });

  it('calls onPress', () => {
    const onPress = jest.fn();
    renderInTheme(<Button label="Save changes" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ignores presses and reports busy while loading', () => {
    const onPress = jest.fn();
    renderInTheme(<Button loading label="Saving…" onPress={onPress} />);
    const button = screen.getByRole('button');
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState).toMatchObject({ busy: true, disabled: false });
  });

  it('reports disabled', () => {
    renderInTheme(<Button disabled label="Save changes" />);
    expect(screen.getByRole('button').props.accessibilityState).toMatchObject({ disabled: true });
  });
});
