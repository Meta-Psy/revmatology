import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LangTabs from '../LangTabs';

describe('LangTabs', () => {
  it('renders RU/UZ/EN tabs', () => {
    render(<LangTabs>{(lang) => <div>Active: {lang}</div>}</LangTabs>);
    expect(screen.getByText('RU')).toBeInTheDocument();
    expect(screen.getByText('UZ')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('shows RU content by default', () => {
    render(<LangTabs>{(lang) => <div data-testid="content">Lang: {lang}</div>}</LangTabs>);
    expect(screen.getByTestId('content')).toHaveTextContent('Lang: ru');
  });

  it('switches to UZ when UZ tab clicked', () => {
    render(<LangTabs>{(lang) => <div data-testid="content">Lang: {lang}</div>}</LangTabs>);
    fireEvent.click(screen.getByText('UZ'));
    expect(screen.getByTestId('content')).toHaveTextContent('Lang: uz');
  });

  it('switches to EN when EN tab clicked', () => {
    render(<LangTabs>{(lang) => <div data-testid="content">Lang: {lang}</div>}</LangTabs>);
    fireEvent.click(screen.getByText('EN'));
    expect(screen.getByTestId('content')).toHaveTextContent('Lang: en');
  });

  it('switches back to RU', () => {
    render(<LangTabs>{(lang) => <div data-testid="content">Lang: {lang}</div>}</LangTabs>);
    fireEvent.click(screen.getByText('EN'));
    expect(screen.getByTestId('content')).toHaveTextContent('Lang: en');
    fireEvent.click(screen.getByText('RU'));
    expect(screen.getByTestId('content')).toHaveTextContent('Lang: ru');
  });

  it('renders non-function children', () => {
    render(<LangTabs><div>Static content</div></LangTabs>);
    expect(screen.getByText('Static content')).toBeInTheDocument();
  });
});
