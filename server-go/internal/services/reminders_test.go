package services

import "testing"

func TestServiceMatchesReminder(t *testing.T) {
	cases := []struct {
		svcType, title, rem string
		want                bool
	}{
		{"Oil Change", "Engine Oil & Filter", "Oil Change", true},
		{"Oil Change", "Oil & Filter Change", "Oil Change", true},
		{"Spark Plugs", "Replace plugs", "Spark Plugs", true},
		{"Engine Air Filter", "Air filter", "Engine Air Filter", true},
		{"Cabin Air Filter", "Cabin filter", "Cabin Air Filter", true},
		{"Brake Service", "Front pads", "Oil Change", false},
		{"Other", "Oil Change DIY", "Oil Change", true},
	}
	for _, c := range cases {
		got := ServiceMatchesReminder(c.svcType, c.title, c.rem)
		if got != c.want {
			t.Fatalf("%q/%q vs %q: got %v want %v", c.svcType, c.title, c.rem, got, c.want)
		}
	}
}
