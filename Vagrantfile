# vim:ft=ruby

Vagrant.configure("2") do |config|
	config.vm.box = "ubuntu/trusty64"
	config.vm.host_name = "portia"
	config.vm.provision :shell, :path => 'docker/provision.sh', :args => [
		"install_deps", "install_splash", "install_python_deps", "configure_nginx", "configure_initctl", "migrate_django_db", "start_portia"
	]
	config.vm.network "private_network", ip: "33.33.33.10"
	config.vm.network "forwarded_port", guest: 9001, host: 9001
	config.vm.provider "virtualbox" do |v|
		v.memory = 2048
		v.cpus = 2
	end
end

