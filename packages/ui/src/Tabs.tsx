import type { ReactNode } from 'react';
import {
  Tabs as AriaTabs,
  TabList,
  Tab,
  TabPanel,
  type TabsProps as AriaTabsProps,
} from 'react-aria-components';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps extends Omit<AriaTabsProps, 'children' | 'className'> {
  /** Accessible name for the tab list itself. */
  label: string;
  items: TabItem[];
  className?: string;
}

const TAB_BASE =
  'px-4 py-2 text-sm font-medium border-b-2 border-transparent cursor-pointer ' +
  'outline-offset-2 outline-2 outline-transparent focus-visible:outline-[var(--color-focus)] ' +
  'selected:border-[var(--color-focus)] selected:text-[var(--color-focus)] ' +
  'text-[var(--color-muted-text)] hover:text-[var(--color-text)]';

/**
 * Wraps React Aria Components' Tabs/TabList/Tab/TabPanel: one sequential tab stop on the tab
 * list, Left/Right arrow keys move and activate, `aria-selected`/`aria-controls` managed
 * automatically (spec `keyboard`, `dynamic_state`; references/keyboard-focus.md's composite
 * widget pattern).
 */
export function Tabs({ label, items, className = '', ...props }: TabsProps) {
  return (
    <AriaTabs {...props} className={className}>
      <TabList aria-label={label} className="flex border-b border-[var(--color-border)]">
        {items.map((item) => (
          <Tab key={item.id} id={item.id} className={TAB_BASE}>
            {item.label}
          </Tab>
        ))}
      </TabList>
      {items.map((item) => (
        <TabPanel key={item.id} id={item.id} className="pt-4">
          {item.content}
        </TabPanel>
      ))}
    </AriaTabs>
  );
}
