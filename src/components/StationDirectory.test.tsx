import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import StationDirectory from '@/components/StationDirectory';
import { allTransitStations, peopleMoverStations } from '@/data/transit';

describe('keyboard access to the station pins', () => {
  it('exposes the stops as a labelled group of buttons', () => {
    render(
      <StationDirectory
        stations={peopleMoverStations}
        numbering={peopleMoverStations}
        selectedId={null}
        onSelect={() => undefined}
        label="Transit stations"
      />
    );
    expect(screen.getByRole('group', { name: 'Transit stations' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(peopleMoverStations.length);
  });

  it('moves between stations with the arrow keys and opens one with Enter', () => {
    const selected: string[] = [];
    render(
      <StationDirectory
        stations={peopleMoverStations}
        numbering={peopleMoverStations}
        selectedId={null}
        onSelect={id => selected.push(id)}
        label="Transit stations"
      />
    );

    const buttons = screen.getAllByRole('button');
    const group = screen.getByRole('group', { name: 'Transit stations' });

    buttons[0]!.focus();
    expect(buttons[0]).toHaveFocus();

    fireEvent.keyDown(group, { key: 'ArrowDown' });
    expect(buttons[1]).toHaveFocus();

    fireEvent.keyDown(group, { key: 'ArrowUp' });
    expect(buttons[0]).toHaveFocus();

    fireEvent.keyDown(group, { key: 'End' });
    expect(buttons[peopleMoverStations.length - 1]).toHaveFocus();

    fireEvent.keyDown(group, { key: 'Home' });
    expect(buttons[0]).toHaveFocus();

    fireEvent.click(buttons[0]!);
    expect(selected).toEqual([peopleMoverStations[0]!.id]);
  });

  it('marks the selected station and keeps only one tab stop in the list', () => {
    const { rerender } = render(
      <StationDirectory
        stations={allTransitStations}
        numbering={allTransitStations}
        selectedId={allTransitStations[3]!.id}
        onSelect={() => undefined}
        label="Transit stations"
      />
    );
    expect(screen.getByRole('button', { current: true })).toHaveAttribute('aria-current', 'true');
    const tabStops = screen
      .getAllByRole('button')
      .filter(button => button.getAttribute('tabindex') === '0');
    expect(tabStops).toHaveLength(1);

    rerender(
      <StationDirectory
        stations={allTransitStations}
        numbering={allTransitStations}
        selectedId={null}
        onSelect={() => undefined}
        label="Transit stations"
      />
    );
    expect(screen.queryByRole('button', { current: true })).toBeNull();
  });
});
