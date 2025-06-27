require_relative "boot"

require "rails"
# Pick the frameworks you want:
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "active_storage/engine"
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_mailbox/engine"
require "action_text/engine"
require "action_view/railtie"
require "action_cable/engine"
# require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module MyApp
  class Application < Rails::Application
    config.load_defaults 7.2

    config.autoload_lib(ignore: %w[assets tasks])

    # ✅ Enable API-only mode
    config.api_only = true
# config/application.rb
config.time_zone = 'Asia/Kolkata' # Or whatever your server/user's primary timezone is
config.active_record.default_timezone = :utc # This is standard and recommended
    # Don't generate system test files.
    config.generators.system_tests = nil

    config.middleware.use ActionDispatch::Cookies
    config.middleware.use ActionDispatch::Session::CookieStore, key: "_session_id"

    # ✅ Correctly placed
    config.autoload_paths << Rails.root.join("lib")
  end
end
